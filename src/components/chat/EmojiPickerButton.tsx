import React, { Suspense, useState } from 'react';
import { Button, Popover, Spin } from 'antd';
import { Smile } from 'lucide-react';
import type { EmojiClickData, EmojiStyle } from 'emoji-picker-react';

// Lazy-loaded so the picker (and its emoji data) stays out of the main bundle
// until the user actually opens it.
const EmojiPicker = React.lazy(() => import('emoji-picker-react'));

interface EmojiPickerButtonProps {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
}

const EmojiPickerButton: React.FC<EmojiPickerButtonProps> = ({
  onSelect,
  disabled,
  className,
}) => {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="topRight"
      arrow={false}
      overlayInnerStyle={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}
      content={
        <Suspense
          fallback={
            <div
              style={{
                width: 320,
                height: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Spin />
            </div>
          }
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            // Native OS emoji: no CDN image requests, and matches exactly
            // what is sent as plain unicode text.
            emojiStyle={'native' as EmojiStyle}
            lazyLoadEmojis
            autoFocusSearch={false}
            previewConfig={{ showPreview: false }}
            height={400}
            width={320}
          />
        </Suspense>
      }
    >
      <Button
        type="text"
        icon={<Smile size={18} strokeWidth={1.75} />}
        className={className}
        disabled={disabled}
        aria-label="Insert emoji"
      />
    </Popover>
  );
};

export default EmojiPickerButton;
