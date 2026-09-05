import { Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function LockedAiSection() {
  return (
    <Card className="flex flex-col items-center gap-4 text-center">
      <Lock className="h-5 w-5 text-muted" aria-hidden="true" />
      <h3 className="text-base font-medium text-foreground">
        Diễn giải chuyên sâu
      </h3>
      <p className="max-w-md text-sm text-muted">
        Mở khóa phần luận giải chi tiết theo từng lá, mối liên hệ giữa ba lá,
        câu hỏi phản tư và gợi ý hành động, bằng cách nạp credit hoặc dùng
        gói VIP. Chi phí và điều kiện sử dụng được hiển thị rõ trước khi
        thanh toán.
      </p>
      <Button variant="secondary" disabled>
        Mở khóa với VIP (sắp ra mắt)
      </Button>
    </Card>
  );
}
