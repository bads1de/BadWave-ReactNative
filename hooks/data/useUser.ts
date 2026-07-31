import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { getUser } from "@/actions/user/getUser";

/**
 * ユーザー情報を取得するためのカスタムフック
 * @returns {UseQueryResult<User | null, Error>} ユーザー情報のクエリ結果
 */
export const useUser = () => {
  return useQuery({
    queryKey: [CACHED_QUERIES.user],
    queryFn: getUser,
  });
};

export default useUser;
