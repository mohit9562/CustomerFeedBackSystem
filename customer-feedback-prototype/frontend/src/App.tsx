import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Search,
  Sparkles,
  MessageSquareText,
  Database,
  RefreshCw,
  Star,
  Upload,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { get, post, api } from "./api";
import "./App.css";

type Review = {
  review_id: string;
  review_title: string;
  review_text: string;
  rating: number;
  sentiment: string;
  verified_purchase: boolean;
  review_date: string;
  product_id: string;
  helpful_votes: number;
  parent_product_id: string;
};
type Page = "dashboard" | "reviews" | "summary" | "chat" | "dataset";

const nav = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["reviews", "Reviews Explorer", Search],
  ["summary", "AI Summary", Sparkles],
  ["chat", "Ask Questions", MessageSquareText],
  ["dataset", "Dataset", Database],
] as const;

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [dataset, setDataset] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const refresh = async () => {
    try {
      setDataset(await get("/dataset/info"));
      setHealth(await get("/health"));
    } catch {}
  };
  useEffect(() => {
    refresh();
  }, []);
  const title = {
    dashboard: "Customer Feedback Overview",
    reviews: "Reviews Explorer",
    summary: "Customer Feedback Intelligence",
    chat: "Ask Your Customer Data",
    dataset: "Dataset Management",
  }[page];
  const subtitle = {
    dashboard:
      "Understand customer experience through review analytics and AI-powered insights.",
    reviews: "Search and filter verified customer feedback.",
    summary: "Generate an evidence-based report from actual customer reviews.",
    chat: "Ask questions about customer feedback and discover insights from real reviews.",
    dataset: "Manage the active review dataset and retrieval index.",
  }[page];
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">IQ</div>
          <span>
            Insight<span>IQ</span>
          </span>
        </div>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => setPage(id)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="side-status">
          <div>
            <span className="status-dot" />
            Dataset: {dataset?.record_count || "—"} records
          </div>
          <div>
            <span
              className={
                health?.llm_status === "configured"
                  ? "status-dot green"
                  : "status-dot amber"
              }
            />
            AI: {health?.llm_status === "configured" ? "Live LLM" : "Demo mode"}
          </div>
          <div className="prototype">Academic prototype</div>
        </div>
      </aside>
      <main>
        <header>
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="header-actions">
            <div className="dataset-pill">
              <Database size={15} />
              {dataset?.dataset_type === "real"
                ? "Real dataset"
                : "Synthetic dataset"}
              <span>{dataset?.record_count || 0}</span>
            </div>
            <button className="icon-button" onClick={refresh} title="Refresh">
              <RefreshCw size={17} />
            </button>
          </div>
        </header>
        <div className="content">
          {page === "dashboard" && <Dashboard />}
          {page === "reviews" && <Reviews />}
          {page === "summary" && <AISummary />}
          {page === "chat" && <Chat />}
          {page === "dataset" && <DatasetPage onUpdate={refresh} />}
        </div>
      </main>
    </div>
  );
}

function Dashboard() {
  const [overview, setOverview] = useState<any>();
  const [ratings, setRatings] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [themes, setThemes] = useState<any>();
  useEffect(() => {
    Promise.all([
      get<any>("/analytics/overview"),
      get<any>("/analytics/ratings"),
      get<any>("/analytics/trends"),
      get<any>("/analytics/themes"),
    ])
      .then(([o, r, t, th]) => {
        setOverview(o);
        setRatings(r.ratings);
        setTrends(t.trends);
        setThemes(th);
      })
      .catch(() => {});
  }, []);
  const sentiment = [
    {
      name: "Positive",
      value: overview?.positive_reviews || 0,
      color: "#22a06b",
    },
    {
      name: "Neutral",
      value: overview?.neutral_reviews || 0,
      color: "#e9a23b",
    },
    {
      name: "Negative",
      value: overview?.negative_reviews || 0,
      color: "#e25555",
    },
  ];
  const kpis = [
    ["Total Reviews", overview?.total_reviews || 0, "reviews"],
    ["Average Rating", overview?.average_rating || 0, "stars"],
    [
      "Positive Reviews",
      `${overview?.sentiment_percentages?.positive || 0}%`,
      `of all feedback`,
    ],
    [
      "Negative Reviews",
      `${overview?.sentiment_percentages?.negative || 0}%`,
      `of all feedback`,
    ],
  ];
  return (
    <>
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <div className="kpi" key={k[0]}>
            <div className={`kpi-icon k${i}`}>
              <Star size={18} />
            </div>
            <div>
              <span>{k[0]}</span>
              <strong>{k[1]}</strong>
              <small>{k[2]}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="chart-grid">
        <ChartCard title="Sentiment Distribution">
          <div className="donut-wrap">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie
                  data={sentiment}
                  dataKey="value"
                  innerRadius={62}
                  outerRadius={86}
                  paddingAngle={2}
                >
                  {sentiment.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend">
              {sentiment.map((s) => (
                <div key={s.name}>
                  <i style={{ background: s.color }} />
                  <span>{s.name}</span>
                  <strong>{s.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
        <ChartCard title="Rating Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ratings}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#4f65d8" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Review Trends">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4f65d8"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <section className="insights">
        <div className="section-head">
          <div>
            <h2>Customer Insights</h2>
            <p>Calculated from review themes and ratings</p>
          </div>
        </div>
        <div className="insight-grid">
          <Insight title="Positive themes" items={themes?.positive_themes} />
          <Insight title="Negative themes" items={themes?.negative_themes} />
          <Insight
            title="Frequently mentioned issues"
            items={themes?.frequent_issues}
          />
        </div>
      </section>
    </>
  );
}
function ChartCard({ title, children }: { title: string; children: any }) {
  return (
    <div className="chart-card">
      <div className="chart-title">
        <h3>{title}</h3>
        <button>···</button>
      </div>
      {children}
    </div>
  );
}
function Insight({ title, items }: { title: string; items?: any[] }) {
  return (
    <div className="insight">
      <h3>{title}</h3>
      {items?.length ? (
        items.slice(0, 5).map((x, i) => (
          <div className="theme-row" key={x.theme}>
            <span>{i + 1}</span>
            <b>{x.theme}</b>
            <small>{x.count} mentions</small>
          </div>
        ))
      ) : (
        <p>No recurring themes identified.</p>
      )}
    </div>
  );
}

function Reviews() {
  const [rows, setRows] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [selected, setSelected] = useState<Review | null>(null);
  const load = async () => {
    const d = await get<any>("/dataset/reviews", {
      page,
      page_size: 12,
      search,
      rating,
      sentiment,
      sort_by: "review_date",
      sort_order: "desc",
    });
    setRows(d.items || d.data || []);
    setTotal(d.total || 0);
  };
  useEffect(() => {
    load();
  }, [page, rating, sentiment]);
  const open = async (r: Review) => {
    try {
      setSelected(await get(`/dataset/reviews/${r.review_id}`));
    } catch {
      setSelected(r);
    }
  };
  return (
    <>
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
            placeholder="Search review title or text..."
          />
        </div>
        <select
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option value={r} key={r}>
              {r} star
            </option>
          ))}
        </select>
        <select
          value={sentiment}
          onChange={(e) => {
            setSentiment(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All sentiment</option>
          <option>Positive</option>
          <option>Neutral</option>
          <option>Negative</option>
        </select>
        <button
          className="secondary"
          onClick={() => {
            setPage(1);
            load();
          }}
        >
          Apply
        </button>
      </div>
      <div className="table-card">
        <div className="table-meta">
          <strong>{total} matching reviews</strong>
        </div>
        <table>
          <thead>
            <tr>
              <th>Review</th>
              <th>Rating</th>
              <th>Sentiment</th>
              <th>Verified</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.review_id} onClick={() => open(r)}>
                <td>
                  <b>{r.review_title}</b>
                  <span>
                    {r.review_text.slice(0, 105)}
                    {r.review_text.length > 105 ? "..." : ""}
                  </span>
                </td>
                <td>
                  <div className="rating">
                    <Star size={14} fill="#e9a23b" /> {r.rating}
                  </div>
                </td>
                <td>
                  <span className={`badge ${r.sentiment.toLowerCase()}`}>
                    {r.sentiment}
                  </span>
                </td>
                <td>
                  {r.verified_purchase ? (
                    <CheckCircle2 size={17} className="verified" />
                  ) : (
                    "—"
                  )}
                </td>
                <td>{r.review_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span>
            Page {page} of {Math.max(1, Math.ceil(total / 12))}
          </span>
          <button
            disabled={page * 12 >= total}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      {selected && (
        <div className="drawer-backdrop" onClick={() => setSelected(null)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <button className="drawer-close" onClick={() => setSelected(null)}>
              <X size={18} />
            </button>
            <span className="eyebrow">{selected.review_id}</span>
            <h2>{selected.review_title}</h2>
            <p className="full-review">{selected.review_text}</p>
            <div className="detail-grid">
              <div>
                <span>Rating</span>
                <strong>{selected.rating} / 5</strong>
              </div>
              <div>
                <span>Sentiment</span>
                <strong>{selected.sentiment}</strong>
              </div>
              <div>
                <span>Product ID</span>
                <strong>{selected.product_id}</strong>
              </div>
              <div>
                <span>Review date</span>
                <strong>{selected.review_date}</strong>
              </div>
              <div>
                <span>Verified purchase</span>
                <strong>{selected.verified_purchase ? "Yes" : "No"}</strong>
              </div>
              <div>
                <span>Helpful votes</span>
                <strong>{selected.helpful_votes}</strong>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function AISummary() {
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>();
  const generate = async () => {
    setLoading(true);
    try {
      setResult(await post("/summary/generate", { sentiment_filter: filter }));
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="summary-toolbar">
        <div className="segmented">
          {["all", "positive", "negative", "neutral"].map((v) => (
            <button
              key={v}
              className={filter === v ? "active" : ""}
              onClick={() => setFilter(v)}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <button className="primary" onClick={generate} disabled={loading}>
          <Sparkles size={17} />
          {loading ? "Generating..." : "Generate AI Summary"}
        </button>
      </div>
      {result ? (
        <div className="report">
          <div className="report-head">
            <div>
              <span className="eyebrow">Customer feedback report</span>
              <h2>Executive Analysis</h2>
            </div>
            <div className="report-meta">
              <span>{result.reviews_analyzed} reviews analyzed</span>
              <span className="mode">
                {result.generation_mode === "live_llm"
                  ? "Live LLM"
                  : "Demo / Extractive"}
              </span>
              <small>{result.generated_at}</small>
            </div>
          </div>
          <ReportSection
            title="Overall Feedback Summary"
            text={result.summary}
          />
          <div className="report-grid">
            <ReportSection
              title="Positive Customer Experiences"
              list={result.positive_feedback}
            />
            <ReportSection
              title="Negative Customer Experiences"
              list={result.negative_feedback}
            />
          </div>
          <div className="report-grid">
            <ReportSection
              title="Common Complaints"
              list={result.common_complaints.map(
                (x: any) => `${x.theme}: ${x.count} mentions`,
              )}
            />
            <ReportSection
              title="Frequently Mentioned Themes"
              list={result.themes
                .slice(0, 6)
                .map((x: any) => `${x.theme}: ${x.count} mentions`)}
            />
          </div>
          <ReportSection
            title="Suggested Areas for Improvement"
            list={result.suggested_improvements}
          />
          <div className="representatives">
            <h3>Representative Customer Reviews</h3>
            {result.representative_reviews.map((r: any) => (
              <div key={r.review_id}>
                <span>{r.review_id}</span>
                <strong>
                  <Star size={13} fill="#e9a23b" /> {r.rating}
                </strong>
                <p>{r.review_text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Sparkles size={28} />
          </div>
          <h2>Generate a customer feedback report</h2>
          <p>
            Select a sentiment scope and summarize the loaded review dataset.
          </p>
        </div>
      )}
    </>
  );
}
function ReportSection({
  title,
  text,
  list,
}: {
  title: string;
  text?: string;
  list?: string[];
}) {
  return (
    <section className="report-section">
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {list && (
        <ul>
          {list.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Chat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const chips = [
    "What are the most common customer complaints?",
    "What do customers like most?",
    "Why are customers giving low ratings?",
    "What problems are mentioned about product quality?",
    "Summarize the negative customer experiences.",
    "What improvements should the business prioritize?",
  ];
  const send = async (q = question) => {
    if (!q.trim()) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const r = await post<any>("/chat/query", {
        question: q,
        session_id: "demo-session",
      });
      setMessages((m) => [...m, { role: "ai", ...r }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          answer: "The query could not be completed. Please try again.",
          supporting_reviews: [],
          generation_mode: "demo_extractive",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="chat-layout">
      <div className="chat-main">
        <div className="suggestions">
          {chips.map((c) => (
            <button key={c} onClick={() => send(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <MessageSquareText size={30} />
              <h2>Start a conversation</h2>
              <p>
                Ask for themes, statistics, or concerns grounded in the reviews.
              </p>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div className="message user" key={i}>
                <p>{m.text}</p>
              </div>
            ) : (
              <div className="message ai" key={i}>
                <div className="ai-avatar">IQ</div>
                <div className="answer">
                  <div className="answer-meta">
                    <strong>InsightIQ</strong>
                    <span>
                      {m.generation_mode === "live_llm"
                        ? "Live LLM"
                        : "Demo / Extractive"}
                    </span>
                  </div>
                  <p>{m.answer}</p>
                  {m.supporting_reviews?.length > 0 && (
                    <details>
                      <summary>
                        <ChevronDown size={15} />
                        View supporting reviews ({m.supporting_reviews.length})
                      </summary>
                      <div className="support-list">
                        {m.supporting_reviews.map((r: any) => (
                          <div key={r.review_id}>
                            <div>
                              <b>{r.review_id}</b>
                              <span>
                                <Star size={12} fill="#e9a23b" /> {r.rating}
                              </span>
                              <span
                                className={`badge ${r.sentiment.toLowerCase()}`}
                              >
                                {r.sentiment}
                              </span>
                            </div>
                            <p>{r.review_text}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ),
          )}
          {loading && (
            <div className="message ai">
              <div className="ai-avatar">IQ</div>
              <div className="loading-answer">
                <i />
                <i />
                <i />
              </div>
            </div>
          )}
        </div>
        <div className="chat-input">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about customer feedback..."
          />
          <button onClick={() => send()} disabled={loading}>
            <Send size={18} />
          </button>
        </div>
      </div>
      <aside className="chat-side">
        <h3>Conversation</h3>
        <button onClick={() => setMessages([])} className="clear">
          <X size={15} />
          Clear conversation
        </button>
        <div className="evidence-note">
          <AlertTriangle size={17} />
          <div>
            <b>Evidence-grounded answers</b>
            <p>
              Responses cite retrieved review records and may include
              insufficient-evidence notices.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function DatasetPage({ onUpdate }: { onUpdate: () => void }) {
  const [info, setInfo] = useState<any>();
  const [busy, setBusy] = useState(false);
  const load = async () => setInfo(await get("/dataset/info"));
  useEffect(() => {
    load();
  }, []);
  const upload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setBusy(true);
    try {
      await api.post("/dataset/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await load();
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  const action = async (url: string) => {
    setBusy(true);
    try {
      await post(url, {});
      await load();
      onUpdate();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="dataset-page">
      <div className="dataset-head">
        <div className="dataset-icon">
          <Database size={24} />
        </div>
        <div>
          <span className="eyebrow">Active dataset</span>
          <h2>{info?.name}</h2>
          <p>{info?.source}</p>
        </div>
        <label className="primary upload">
          <Upload size={17} />
          Upload CSV
          <input type="file" accept=".csv" onChange={upload} />
        </label>
      </div>
      <div className="dataset-grid">
        <div>
          <span>Loaded records</span>
          <strong>{info?.record_count || 0}</strong>
        </div>
        <div>
          <span>Dataset type</span>
          <strong className="tag">
            {info?.dataset_type === "real" ? "Real" : "Synthetic"}
          </strong>
        </div>
        <div>
          <span>Retrieval method</span>
          <strong>TF-IDF</strong>
        </div>
        <div>
          <span>Vector status</span>
          <strong className="success">
            <CheckCircle2 size={15} />
            {info?.vector_status}
          </strong>
        </div>
      </div>
      <div className="dataset-actions">
        <button onClick={() => action("/dataset/reload")} disabled={busy}>
          <RefreshCw size={16} />
          Reload sample dataset
        </button>
        <button onClick={() => action("/dataset/reindex")} disabled={busy}>
          <Database size={16} />
          Re-index reviews
        </button>
      </div>
      <div className="dataset-note">
        <AlertTriangle size={18} />
        <p>
          <b>Dataset transparency:</b> This prototype uses a subset of Amazon
          Reviews'23 All Beauty data. Uploaded and synthetic records are clearly
          labelled. Synthetic fallback data must never be described as real
          customer feedback.
        </p>
      </div>
    </div>
  );
}
export default App;
