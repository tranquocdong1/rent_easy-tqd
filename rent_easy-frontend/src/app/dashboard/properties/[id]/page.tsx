'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import { propertiesApi } from '@/services/api/properties';
import { PropertyDetail } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPropertyType } from '@/lib/utils';

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const router = useRouter();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) return;

    const fetchProperty = async () => {
      try {
        const res = await propertiesApi.getById(propertyId);
        setProperty(res.data);
      } catch (error: any) {
        if (error.response?.status === 404) {
          notFound();
        } else {
          console.error('Failed to load property details:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Đang tải thông tin...</div>;
  }

  if (!property) {
    return null; // fallback or handled by notFound
  }

  const { statistics } = property;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{property.name}</h1>
        </div>
        <div className="flex space-x-2">
          <Link href={`/dashboard/properties/${property.id}/edit`} passHref>
            <Button variant="secondary">Sửa Property</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Loại hình</p>
                <p className="font-medium">{formatPropertyType(property.propertyType)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${property.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {property.status === 'ACTIVE' ? 'Đang hoạt động' : property.status === 'INACTIVE' ? 'Ngừng hoạt động' : property.status}
                  </span>
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Địa chỉ</p>
              <p className="font-medium">{property.address}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Mô tả</p>
              <p className="font-medium whitespace-pre-wrap">
                {property.description || 'Chưa có mô tả'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Thống kê Phòng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Tổng số phòng</p>
              <p className="text-lg font-bold">{statistics?.totalRooms || 0}</p>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <p className="text-sm font-medium">Đang trống</p>
              <p className="text-lg font-bold">{statistics?.availableRooms || 0}</p>
            </div>
            <div className="flex justify-between items-center text-blue-600">
              <p className="text-sm font-medium">Đang cho thuê</p>
              <p className="text-lg font-bold">{statistics?.occupiedRooms || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
