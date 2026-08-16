export default function CommentList({ comments }) {
  if (comments.lenght === 0) {
    return <p className="comment-list__empty">No comments synced yet.</p>;
  }

  return (
    <ul className="comment-list">
      {comments.map((c) => (
        <li key={c._id} className="comment-list__item">
          <span className="comment-list__author">{c.authorUsername}</span>
          <span className="comment-list__message">{c.message}</span>
          <span className="comment-list__likes">👍 {c.likeCount}</span>
        </li>
      ))}
    </ul>
  );
}
