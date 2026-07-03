import { useState } from 'react';
import { Button } from '../ui/Button';
import { CreatePostSheet, type PostDraft } from './CreatePostSheet';

interface ShareToFeedButtonProps {
  draft: PostDraft;
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export function ShareToFeedButton({
  draft,
  title = 'Compartir en el feed',
  variant = 'outline',
}: ShareToFeedButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button title={title} onPress={() => setOpen(true)} variant={variant} />
      <CreatePostSheet visible={open} onClose={() => setOpen(false)} initialDraft={draft} />
    </>
  );
}
