import { useState } from "react";
import postApi from "../api/postApi.js";
import CommentList from "./CommentList.jsx";

export default function PostCard({ post }) {
  const [comments, setComments] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [insights, setInsights] = useState(post.insights || null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [error, setError] = useState(null);

  const hasInsights = insights && Object.keys(insights).length > 0;

  const handleLoadComments = async () => {
    setLoadingComments(true);
    setError(null);
    try {
      const res = await postApi.syncComments(post._id);
      setComments(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLoadInsights = async () => {
    setLoadingInsights(true);
    setError(null);
    try {
      const res = await postApi.syncInsights(post._id);
      setInsights(res.data.insights);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <article className={`post-card post-card--${post.platform}`}>
      <header className="post-card__header">
        <span className="post-card__badge">{post.platform}</span>
        <span className="post-card__author">{post.author}</span>
      </header>

      {post.mediaUrl && (
        <img
          className="post-card__media"
          src={post.mediaUrl}
          alt=""
          loading="lazy"
        />
      )}

      {post.message && <p className="post-card__message">{post.message}</p>}

      <footer className="post-card__footer">
        <span>👍 {post.likeCount}</span>
        <span>💬 {post.commentCount}</span>
        {post.permalink && (
          <a href={post.permalink} target="_blank" rel="noreferrer">
            View original
          </a>
        )}
      </footer>

      <div className="post-card__extra">
        <button
          type="button"
          onClick={handleLoadComments}
          disabled={loadingComments}
        >
          {loadingComments ? "Loading..." : "Load comments"}
        </button>
        <button
          type="button"
          onClick={handleLoadInsights}
          disabled={loadingInsights}
        >
          {loadingInsights ? "Loading..." : "Load insights"}
        </button>
      </div>

      {error && <p className="error-state post-card__error">{error}</p>}

      {hasInsights && (
        <div className="post-card__insights">
          {Object.entries(insights).map(([key, value]) => (
            <span key={key} className="post-card__insight-chip">
              {key.replace(/_/g, " ")}: {value}
            </span>
          ))}
        </div>
      )}

      {comments !== null && (
        <div className="post-card__comments">
          <CommentList comments={comments} />
        </div>
      )}
    </article>
  );
}
