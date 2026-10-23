import { type JSX, memo } from "react";
import { BoundedImageItem } from "./BoundedImageItem";
import { imageLimit, type BoundedImage } from "./bounded-images";
import type { BoundedItemActions } from "./bounded-compression-actions";

type Props = BoundedItemActions & {
  items: BoundedImage[];
  body: string;
  cover: string;
  busy: boolean;
};

function BoundedImageListView({
  items,
  body,
  cover,
  busy,
  changeLimit,
  removeItem,
}: Props): JSX.Element {
  return (
    <ol className="divide-y divide-border/60">
      {items.map((item, index) => (
        <BoundedImageItem
          key={item.id}
          item={item}
          isCover={index === 0}
          value={imageLimit(item, index, body, cover)}
          busy={busy}
          changeLimit={changeLimit}
          removeItem={removeItem}
        />
      ))}
    </ol>
  );
}

export const BoundedImageList = memo(BoundedImageListView);
