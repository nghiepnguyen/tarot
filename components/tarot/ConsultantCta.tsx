import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ConsultantCta() {
  return (
    <Card className="flex flex-col items-center gap-4 text-center">
      <h3 className="text-base font-medium text-foreground">
        Cần một góc nhìn sâu hơn?
      </h3>
      <p className="max-w-md text-sm text-muted">
        Đặt lịch với người tư vấn tarot chuyên môn để trao đổi trực tiếp về
        câu hỏi của bạn.
      </p>
      <Button variant="secondary" disabled>
        Đặt lịch tư vấn (sắp ra mắt)
      </Button>
    </Card>
  );
}
