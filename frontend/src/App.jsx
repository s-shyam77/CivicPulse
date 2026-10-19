
import { useEffect, useRef, useState } from "react";
import {
  Home,
  MapPin,
  Plus,
  ThumbsUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Menu,
  ArrowUpRight,
  MessageCircle,
  Settings,
  Users,
  Building2,
} from "lucide-react";
import "./App.css";

const API_URL = "http://localhost:5000/api/issues";

function App() {
  const [issues, setIssues] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Roads");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [photo, setPhoto] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [gpsMessage, setGpsMessage] = useState("");

  const [voted, setVoted] = useState([]);
  const [notice, setNotice] = useState("");
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const photoInputRef = useRef(null);

  // Load saved reports from the backend
  async function loadIssues() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load community reports.");
      }

      const data = await response.json();

      setIssues(
        data.map((issue) => ({
          ...issue,
          status:
            issue.status === "Reported" ? "Pending" : issue.status,
          votes: issue.votes ?? 0,
          color:
            issue.status === "Resolved"
              ? "green"
              : issue.category === "Electricity"
              ? "blue"
              : "orange",
        }))
      );
    } catch (error) {
      console.error("Loading reports failed:", error);
      setNotice(
        "Reports load nahi hui. Check karo ki backend server chal raha hai."
      );
    } finally {
      setLoadingIssues(false);
    }
  }

  useEffect(() => {
    loadIssues();
  }, []);

  // Capture GPS coordinates
  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setGpsMessage("Your browser does not support GPS location.");
      return;
    }

    setGpsMessage("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsMessage("Location captured successfully!");
      },
      (error) => {
        console.error("GPS error:", error);
        setGpsMessage(
          "Location unavailable. Allow browser location permission or continue without GPS."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  // Submit a report to the backend
  async function addIssue(event) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setNotice("");

    let uploadedSuccessfully = false;

    try {
      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("category", category);
      formData.append("location", location.trim());
      formData.append("description", description.trim());

      if (latitude !== null && longitude !== null) {
        formData.append("latitude", String(latitude));
        formData.append("longitude", String(longitude));
      }

      if (photo) {
        formData.append("photo", photo);
      }

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Report submission failed.");
      }

      const newIssue = {
        ...data,
        status:
          data.status === "Reported" ? "Pending" : data.status,
        votes: data.votes ?? 0,
        color: "orange",
      };

      setIssues((previous) => [newIssue, ...previous]);

      setTitle("");
      setCategory("Roads");
      setLocation("");
      setDescription("");
      setPhoto(null);
      setLatitude(null);
      setLongitude(null);
      setGpsMessage("");

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }

      setShowForm(false);
      setNotice("Report submitted and saved successfully!");
      uploadedSuccessfully = true;
    } catch (error) {
      console.error("Report submission failed:", error);
      setNotice(
        error.message || "Could not submit report. Check the backend."
      );
    } finally {
      setSubmitting(false);
    }

    if (uploadedSuccessfully) {
      // The new report is already added to the dashboard.
      // Refresh from the server to keep the displayed data in sync.
      loadIssues();
    }
  }

  // Temporary frontend-only support button
  function upvoteIssue(id) {
    if (voted.includes(id)) {
      setNotice("You have already supported this issue in this session.");
      return;
    }

    setIssues((previous) =>
      previous.map((issue) =>
        issue.id === id
          ? { ...issue, votes: (issue.votes ?? 0) + 1 }
          : issue
      )
    );

    setVoted((previous) => [...previous, id]);
    setNotice("Your support has been counted for this session.");
  }

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      (issue.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (issue.location || "").toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || issue.status === filter;

    return matchesSearch && matchesFilter;
  });

  const pending = issues.filter(
    (issue) => issue.status === "Pending"
  ).length;

  const progress = issues.filter(
    (issue) => issue.status === "In Progress"
  ).length;

  const resolved = issues.filter(
    (issue) => issue.status === "Resolved"
  ).length;

  const resolutionPercentage = issues.length
    ? Math.round((resolved / issues.length) * 100)
    : 0;

  function getPhotoUrl(issue) {
    if (!issue.photo_url) return null;

    if (issue.photo_url.startsWith("http")) {
      return issue.photo_url;
    }

    return `http://localhost:5000${
      issue.photo_url.startsWith("/")
        ? issue.photo_url
        : `/${issue.photo_url}`
    }`;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Building2 size={23} />
          </div>
          <div>
            <h2>CivicPulse</h2>
            <span>COMMUNITY FIRST</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <button className="nav-item active">
          <Home size={18} /> Overview
        </button>

        <button
          className="nav-item"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} /> Report an issue
        </button>

        <button
          className="nav-item"
          onClick={() => {
            setFilter("All");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <MapPin size={18} /> Community feed
        </button>

        <div className="nav-label second-label">
          YOUR COMMUNITY
        </div>

        <div className="community-card">
          <div className="community-icon">
            <Users size={19} />
          </div>
          <div>
            <strong>Jaipur Community</strong>
            <span>Local issue tracker</span>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <AlertTriangle size={19} />
            </div>
            <strong>See a problem?</strong>
            <p>
              Your report can make a difference in your neighbourhood.
            </p>
            <button onClick={() => setShowForm(true)}>
              Report now <ArrowUpRight size={15} />
            </button>
          </div>

          <button className="nav-item">
            <Settings size={18} /> Settings
          </button>

          <div className="profile">
            <div className="avatar">S</div>
            <div>
              <strong>Community Member</strong>
              <span>Citizen account</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Menu">
            <Menu />
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Overview</strong>
          </div>

          <div className="topbar-right">
            <span className="live-dot"></span>
            <span className="live-text">Community dashboard</span>
            <div className="avatar small-avatar">S</div>
          </div>
        </header>

        <section className="welcome">
          <div>
            <div className="eyebrow">
              <span></span> YOUR VOICE MATTERS
            </div>
            <h1>
              Let's improve our <span>community.</span>
            </h1>
            <p>
              Report local issues, support your neighbours, and track
              change in your city.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} /> Report an issue
          </button>
        </section>

        {notice && (
          <div className="notice" role="status">
            {notice}
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <span>Total issues</span>
              <div className="stat-icon purple">
                <AlertTriangle size={19} />
              </div>
            </div>
            <div className="stat-number">{issues.length}</div>
            <div className="stat-foot">Community reports</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Pending</span>
              <div className="stat-icon amber">
                <Clock size={19} />
              </div>
            </div>
            <div className="stat-number">{pending}</div>
            <div className="stat-foot">Awaiting action</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>In progress</span>
              <div className="stat-icon blue">
                <ArrowUpRight size={19} />
              </div>
            </div>
            <div className="stat-number">{progress}</div>
            <div className="stat-foot">Being addressed</div>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Resolved</span>
              <div className="stat-icon green">
                <CheckCircle size={19} />
              </div>
            </div>
            <div className="stat-number">{resolved}</div>
            <div className="stat-foot">Issues completed</div>
          </div>
        </section>

        <section className="content-grid">
          <div className="issues-panel">
            <div className="panel-heading">
              <div>
                <h2>Community issues</h2>
                <p>
                  See what's happening around your neighbourhood.
                </p>
              </div>

              <button
                className="text-btn"
                onClick={() => setFilter("All")}
              >
                View all <ArrowUpRight size={15} />
              </button>
            </div>

            <div className="filters">
              <div className="search-box">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search issues or locations..."
                />
              </div>

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option>All</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </div>

            <div className="issue-list">
              {loadingIssues && (
                <p className="form-note">Loading community reports...</p>
              )}

              {!loadingIssues &&
                filteredIssues.map((issue) => (
                  <article className="issue-card" key={issue.id}>
                    <div className={`issue-symbol ${issue.color}`}>
                      <AlertTriangle size={21} />
                    </div>

                    <div className="issue-body">
                      <div className="issue-meta">
                        <span>{issue.category}</span>
                        <span
                          className={`status status-${(
                            issue.status || "Pending"
                          )
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {issue.status}
                        </span>
                      </div>

                      <h3>{issue.title}</h3>
                      <p>{issue.description}</p>

                      <div className="issue-location">
                        <MapPin size={14} /> {issue.location || "Location not provided"}
                      </div>

                      {getPhotoUrl(issue) && (
                        <div className="photo-preview">
                          <img
                            src={getPhotoUrl(issue)}
                            alt={`Evidence for ${issue.title}`}
                            loading="lazy"
                            style={{
                              width: "100%",
                              maxWidth: "320px",
                              maxHeight: "220px",
                              objectFit: "cover",
                              borderRadius: "12px",
                              marginTop: "12px",
                            }}
                          />
                        </div>
                      )}

                      {issue.latitude != null &&
                        issue.longitude != null && (
                          <p className="form-note">
                            GPS: {Number(issue.latitude).toFixed(5)},{" "}
                            {Number(issue.longitude).toFixed(5)}
                          </p>
                        )}

                      <div className="issue-actions">
                        <button
                          className={
                            voted.includes(issue.id)
                              ? "vote-btn voted"
                              : "vote-btn"
                          }
                          onClick={() => upvoteIssue(issue.id)}
                        >
                          <ThumbsUp size={15} /> Support{" "}
                          <strong>{issue.votes ?? 0}</strong>
                        </button>

                        <span>
                          <MessageCircle size={15} /> Community report
                        </span>
                      </div>
                    </div>
                  </article>
                ))}

              {!loadingIssues && filteredIssues.length === 0 && (
                <div className="empty-state">
                  No issues found. Try another search or report a new issue.
                </div>
              )}
            </div>
          </div>

          <aside className="right-column">
            <div className="impact-card">
              <div className="impact-heading">
                <div>
                  <span className="impact-label">COMMUNITY IMPACT</span>
                  <h3>Every report counts.</h3>
                </div>
                <div className="impact-icon">
                  <CheckCircle size={22} />
                </div>
              </div>

              <p>
                When citizens speak up together, communities become safer,
                cleaner, and better connected.
              </p>

              <div className="impact-progress">
                <div>
                  <span>Resolution progress</span>
                  <strong>{resolutionPercentage}%</strong>
                </div>
                <div className="progress-track">
                  <span
                    style={{ width: `${resolutionPercentage}%` }}
                  ></span>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick actions</h3>

              <button onClick={() => setShowForm(true)}>
                <div className="quick-icon purple">
                  <Plus size={18} />
                </div>
                <span>
                  <strong>Report a problem</strong>
                  <small>Tell us what's wrong</small>
                </span>
                <ArrowUpRight size={17} />
              </button>

              <button
                onClick={() => {
                  setFilter("In Progress");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <div className="quick-icon blue">
                  <Clock size={18} />
                </div>
                <span>
                  <strong>Track progress</strong>
                  <small>Follow active reports</small>
                </span>
                <ArrowUpRight size={17} />
              </button>

              <button
                onClick={() => {
                  setFilter("Resolved");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <div className="quick-icon green">
                  <CheckCircle size={18} />
                </div>
                <span>
                  <strong>See resolved issues</strong>
                  <small>Explore completed work</small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            </div>

            <div className="map-card">
              <div className="map-top">
                <div>
                  <h3>Local activity</h3>
                  <p>Community issue locations</p>
                </div>
                <MapPin size={20} />
              </div>

              <div className="map-visual">
                <div className="map-road road-one"></div>
                <div className="map-road road-two"></div>
                <div className="map-road road-three"></div>
                <div className="map-block block-one"></div>
                <div className="map-block block-two"></div>
                <div className="map-block block-three"></div>
                <div className="map-block block-four"></div>
                <div className="map-pin pin-one">
                  <MapPin size={22} />
                </div>
                <div className="map-pin pin-two">
                  <MapPin size={22} />
                </div>
                <div className="map-pin pin-three">
                  <MapPin size={22} />
                </div>
                <span className="map-caption">JAIPUR, RAJASTHAN</span>
              </div>

              <p className="map-note">
                Illustrative map preview — live map integration comes next.
              </p>
            </div>
          </aside>
        </section>

        <footer className="footer">
          <span>© 2026 CivicPulse</span>
          <span>Report it. Support it. Resolve it.</span>
          <span>Built for stronger communities.</span>
        </footer>
      </main>

      {showForm && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!submitting) setShowForm(false);
          }}
        >
          <form
            className="issue-form"
            onClick={(event) => event.stopPropagation()}
            onSubmit={addIssue}
          >
            <div className="form-heading">
              <div>
                <span className="impact-label">COMMUNITY VOICE</span>
                <h2>Report an issue</h2>
                <p>Share a problem in your neighbourhood.</p>
              </div>

              <button
                type="button"
                className="close-btn"
                disabled={submitting}
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <label>
              Issue title
              <input
                required
                minLength={4}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Broken streetlight near park"
              />
            </label>

            <label>
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option>Roads</option>
                <option>Electricity</option>
                <option>Sanitation</option>
                <option>Water supply</option>
                <option>Public safety</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Location
              <input
                required
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Area, street or landmark"
              />
            </label>

            <button
              type="button"
              className="text-btn"
              onClick={getCurrentLocation}
            >
              <MapPin size={17} /> Use My Location
            </button>

            {gpsMessage && (
              <p className="form-note">{gpsMessage}</p>
            )}

            {latitude !== null && longitude !== null && (
              <p className="form-note">
                Coordinates: {latitude.toFixed(5)},{" "}
                {longitude.toFixed(5)}
              </p>
            )}

            <label>
              Photo evidence (optional)
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => {
                  const selected = event.target.files?.[0];

                  if (selected && !selected.type.startsWith("image/")) {
                    setNotice("Please select an image file.");
                    event.target.value = "";
                    return;
                  }

                  if (selected && selected.size > 5 * 1024 * 1024) {
                    setNotice("Photo must be 5 MB or smaller.");
                    event.target.value = "";
                    return;
                  }

                  setPhoto(selected || null);
                  setNotice("");
                }}
              />
            </label>

            {photo && (
              <div className="photo-preview">
                <p className="form-note">
                  Selected photo: {photo.name}
                </p>

                <button
                  type="button"
                  className="text-btn"
                  onClick={() => {
                    setPhoto(null);
                    if (photoInputRef.current) {
                      photoInputRef.current.value = "";
                    }
                  }}
                >
                  Remove photo
                </button>
              </div>
            )}

            <label>
              Description
              <textarea
                required
                minLength={10}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the problem..."
                rows={4}
              />
            </label>

            <div className="form-note">
              <AlertTriangle size={16} />
              Please provide accurate information so the right team can
              respond.
            </div>

            <button
              type="submit"
              className="primary-btn submit-btn"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit report"}
              {!submitting && <ArrowUpRight size={17} />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
