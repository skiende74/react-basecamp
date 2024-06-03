import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { PRODUCTS_ENDPOINT } from "../api/endpoints";
import { server } from "../mocks/server";
import useProducts from "./useProducts";
describe("useProducts 테스트", () => {
  describe("상품 목록 조회", () => {
    it("초기에 첫 페이지의 상품 20개를 불러온다.", async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.products).toHaveLength(20);
        expect(result.current.page).toBe(1);
      });
    });
    it("다음 페이지의 상품 4개를 추가로 불러온다.", async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.products).toHaveLength(20);
        expect(result.current.page).toBe(1);
      });

      act(() => {
        result.current.fetchNextPage();
      });

      await waitFor(() => {
        expect(result.current.products).toHaveLength(24);
        expect(result.current.page).toBe(2);
      });
    });

    it("상품 목록 조회 중 로딩상태", () => {
      const { result } = renderHook(() => useProducts());

      expect(result.current.loading).toBe(true);
    });

    it("상품 목록 조회 중 에러상태", async () => {
      server.use(http.get(PRODUCTS_ENDPOINT, () => new HttpResponse(null, { status: 500 })));

      const { result } = renderHook(useProducts);

      await waitFor(() => {
        expect(result.current.products).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
      });
    });

    it("모든 페이지의 상품을 불러오면 더 이상 요청하지 않는다.", async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.products).toHaveLength(20);
      });

      for (let i = 2; i < 22; i++) {
        await waitFor(() => {
          act(() => {
            result.current.fetchNextPage();
          });
        });

        const expectedLength = 20 + (i - 1) * 4;

        await waitFor(() => {
          expect(result.current.products).toHaveLength(expectedLength);
          expect(result.current.page).toBe(i);
        });
      }
      act(() => {
        result.current.fetchNextPage();
      });
      await waitFor(() => {
        expect(result.current.products).toHaveLength(100);
        expect(result.current.page).toBe(21);
      });
    });

    it("페이지네이션으로 추가 데이터를 불러올 때 로딩 상태를 표시한다", async () => {
      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.fetchNextPage();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});