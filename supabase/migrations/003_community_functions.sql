-- 게시글 좋아요 수 증가 함수
CREATE OR REPLACE FUNCTION increment_post_like_count(post_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE community_post 
  SET like_count = like_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 게시글 좋아요 수 감소 함수
CREATE OR REPLACE FUNCTION decrement_post_like_count(post_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE community_post 
  SET like_count = GREATEST(like_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 게시글 댓글 수 증가 함수
CREATE OR REPLACE FUNCTION increment_post_comment_count(post_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE community_post 
  SET comment_count = comment_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 게시글 댓글 수 감소 함수
CREATE OR REPLACE FUNCTION decrement_post_comment_count(post_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE community_post 
  SET comment_count = GREATEST(comment_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 게시글 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_post_view_count(post_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE community_post 
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION increment_post_like_count(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_like_count(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_post_comment_count(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_comment_count(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_post_view_count(BIGINT) TO anon, authenticated;
