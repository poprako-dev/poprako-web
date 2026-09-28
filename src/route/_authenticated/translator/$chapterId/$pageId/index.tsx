import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { WebTranslator } from "@/route/_authenticated/translator/business/remote/WebTranslator";
import type { ReactElement } from "react";
import {
  parseTranslatorSearch,
  translatorReturnDestination,
  translatorStartMode,
} from "@/route/_authenticated/translator/business/contract/translator-search";

export const Route = createFileRoute("/_authenticated/translator/$chapterId/$pageId/")({
  validateSearch: parseTranslatorSearch,
  component: TranslatorPage,
});

function TranslatorPage(): ReactElement {
  const { chapterId, pageId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const onExit = (): void => {
    const destination = translatorReturnDestination(search);
    if (destination) {
      void navigate({
        to: destination.to,
        search: destination.search,
      });
      return;
    }
    router.history.back();
  };

  return (
    <WebTranslator
      chapterId={chapterId}
      startPageId={pageId}
      startMode={translatorStartMode(search)}
      onExit={onExit}
    />
  );
}
