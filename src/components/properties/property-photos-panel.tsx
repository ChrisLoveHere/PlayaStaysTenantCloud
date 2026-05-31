"use client";

import Image from "next/image";
import { useActionState, useTransition } from "react";
import {
  deletePropertyPhoto,
  uploadPropertyPhotos,
} from "@/lib/actions/property-photos";
import type { PropertyPhotoActionState } from "@/lib/actions/property-photos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Photo = {
  id: string;
  url: string;
  caption: string | null;
};

function DeletePhotoButton({
  photoId,
  propertyId,
}: {
  photoId: string;
  propertyId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await deletePropertyPhoto(photoId, propertyId);
        })
      }
    >
      {pending ? "…" : "Remove"}
    </Button>
  );
}

export function PropertyPhotosPanel({
  propertyId,
  photos,
}: {
  propertyId: string;
  photos: Photo[];
}) {
  const uploadAction = uploadPropertyPhotos.bind(null, propertyId);
  const [state, formAction, pending] = useActionState(
    uploadAction as (
      prev: PropertyPhotoActionState,
      fd: FormData
    ) => Promise<PropertyPhotoActionState>,
    {} as PropertyPhotoActionState
  );

  return (
    <Card className="shadow-sm ring-1 ring-border/60">
      <CardHeader>
        <CardTitle className="text-base">Listing photos</CardTitle>
        <CardDescription>
          Shown on the prospect property browser. Up to 10 images per upload.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-lg border"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption ?? "Property photo"}
                  width={240}
                  height={160}
                  className="h-32 w-full object-cover"
                  unoptimized
                />
                <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100">
                  <DeletePhotoButton photoId={photo.id} propertyId={propertyId} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No photos yet.</p>
        )}
      </CardContent>
      <form action={formAction} encType="multipart/form-data">
        <CardContent className="space-y-4 border-t pt-4">
          {state.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              {state.success}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="photos">Add photos</Label>
            <Input id="photos" name="photos" type="file" accept="image/*" multiple />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Uploading…" : "Upload photos"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
