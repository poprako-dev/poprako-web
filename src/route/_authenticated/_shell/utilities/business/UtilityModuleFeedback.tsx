import type { ReactElement } from "react";
import { LoadingCircle } from "@/shared/component/LoadingCircle";
import { reloadPage } from "@/shared/utility/reload-page";
import { Button } from "@/shared/component/Button";

type Props = { failed: boolean };

export function UtilityModuleFeedback({ failed }: Props): ReactElement {
  return (
    <div className="flex min-h-28 flex-1 flex-col items-center justify-center gap-2">
      {failed ? (
        <>
          <p role="alert" className="text-xs text-text-muted-warm">
            加载工具失败
          </p>
          <Button variant="ghost" size="xs" onClick={reloadPage}>
            刷新页面
          </Button>
        </>
      ) : (
        <LoadingCircle size={18} aria-label="正在加载工具" />
      )}
    </div>
  );
}
