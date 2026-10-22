import { useCompositionBarrier } from "./use-composition-barrier";
import { useEffect, useRef } from "react";
import { useToastStore } from "@/shared/component/notification-toast/toast-store";
import { translatorModeModule } from "./translator-mode-module";
import type { TranslatorMode } from "../unit/translator-mode";

type Options = {
  currentView: TranslatorMode;
  nextView: TranslatorMode | undefined;
  commit: () => void;
};

export function usePreparedModeSwitch(options: Options): () => void {
  const afterComposition = useCompositionBarrier();
  const activeRef = useRef(false);
  const pendingRef = useRef<TranslatorMode | null>(null);
  const latestRef = useRef(options);
  useEffect(() => {
    latestRef.current = options;
  });
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);
  return () => {
    if (!options.nextView || pendingRef.current === options.nextView) return;
    const resource = translatorModeModule(options.nextView);
    const snapshot = resource.getSnapshot();
    if (snapshot.status === "error") {
      showModeLoadError(snapshot.error);
      return;
    }
    if (snapshot.status === "ready") {
      afterComposition(() => {
        commitIfCurrent(options, latestRef.current, activeRef.current);
      });
      return;
    }
    pendingRef.current = options.nextView;
    void resource
      .load()
      .then(() => {
        afterComposition(() => {
          commitIfCurrent(options, latestRef.current, activeRef.current);
        });
      })
      .catch((error: unknown) => {
        if (activeRef.current) showModeLoadError(error);
      })
      .finally(() => {
        if (pendingRef.current === options.nextView) pendingRef.current = null;
      });
  };
}

function commitIfCurrent(options: Options, latest: Options, active: boolean): void {
  if (
    active &&
    latest.currentView === options.currentView &&
    latest.nextView === options.nextView
  ) {
    latest.commit();
  }
}

function showModeLoadError(error: unknown): void {
  console.error("[Translator] 加载模式失败:", error);
  useToastStore.getState().showToast("加载模式失败，请保存后刷新页面重试", "error");
}
