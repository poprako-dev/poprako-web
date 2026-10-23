import { memo, type ComponentProps, type JSX } from "react";
import { shallow } from "zustand/vanilla/shallow";
import { PageCard } from "./PageCard";

type Props = Omit<ComponentProps<typeof PageCard>, "onClick" | "onDelete" | "onReupload"> & {
  onClickPage?: ((pageId: string) => void) | undefined;
  onDeletePage?: ((pageId: string) => void) | undefined;
  onReuploadPage?: ((pageId: string, file: File) => void) | undefined;
};

function PageListItemView({
  onClickPage,
  onDeletePage,
  onReuploadPage,
  ...props
}: Props): JSX.Element {
  const pageId = props.page.id;
  return (
    <PageCard
      {...props}
      onClick={
        onClickPage
          ? () => {
              onClickPage(pageId);
            }
          : undefined
      }
      onDelete={
        onDeletePage
          ? () => {
              onDeletePage(pageId);
            }
          : undefined
      }
      onReupload={
        onReuploadPage
          ? (file) => {
              onReuploadPage(pageId, file);
            }
          : undefined
      }
    />
  );
}

function samePageListItem(previous: Props, next: Props): boolean {
  const { page: previousPage, ...previousProps } = previous;
  const { page: nextPage, ...nextProps } = next;
  return shallow(previousPage, nextPage) && shallow(previousProps, nextProps);
}

export const PageListItem = memo(PageListItemView, samePageListItem);
