import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageStatusProps {
  isSender: boolean;
  isRead: boolean;
}

const MessageStatus: React.FC<MessageStatusProps> = ({ isSender, isRead }) => {
  if (!isSender) {
    return null;
  }

  return (
    <div className="flex items-center justify-end h-4">
      {isRead ? (
        <CheckCheck className="h-4 w-4 text-blue-400" />
      ) : (
        <Check className={cn("h-4 w-4", "text-gray-400")} />
      )}
    </div>
  );
};

export default MessageStatus;