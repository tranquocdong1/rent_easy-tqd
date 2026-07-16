import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PropertyNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h2 className="text-2xl font-bold">Không tìm thấy Property</h2>
      <p className="text-muted-foreground">
        Property này không tồn tại hoặc bạn không có quyền truy cập.
      </p>
      <Link href="/dashboard/properties" passHref>
        <Button>Quay lại danh sách</Button>
      </Link>
    </div>
  );
}
