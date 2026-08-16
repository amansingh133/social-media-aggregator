import PostCard from './PostCard.jsx';

export default function PostList({ posts }) {
  if (posts.length === 0) {
    return <p className="empty-state">No posts found.</p>;
  }

  return (
    <div className="post-list">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}
    </div>
  );
}
