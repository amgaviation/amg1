import { getMediaAsset, type MediaAsset } from "@/lib/media/manifest";
import { cn } from "@/lib/utils";

type MediaFrameProps = {
  assetId: string;
  className?: string;
  priority?: boolean;
  overlay?: React.ReactNode;
};

function ratioClass(aspectRatio: string) {
  if (aspectRatio === "21:9") return "aspect-[21/9]";
  if (aspectRatio === "4:3") return "aspect-[4/3]";
  if (aspectRatio === "3:2") return "aspect-[3/2]";
  return "aspect-video";
}

function PlaceholderLabel({ asset }: { asset: MediaAsset }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div className="absolute left-4 top-4 max-w-xs rounded-md border border-white/[0.20] bg-[#050B14]/75 px-3 py-2 text-[0.65rem] uppercase tracking-[0.16em] text-white/80 backdrop-blur">
      {asset.id}
      <br />
      {asset.type} | {asset.aspectRatio} | {asset.status}
    </div>
  );
}

export function ResponsiveImageFrame({ assetId, className, priority = false, overlay }: MediaFrameProps) {
  const asset = getMediaAsset(assetId);
  return (
    <figure className={cn("relative isolate overflow-hidden bg-[#050B14]", ratioClass(asset.aspectRatio), className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.sourcePath || asset.fallbackAsset}
        alt={asset.altText}
        loading={priority ? "eager" : "lazy"}
        className="h-full w-full object-cover"
        style={{ objectPosition: asset.objectPosition ?? "center center" }}
      />
      <PlaceholderLabel asset={asset} />
      {overlay}
    </figure>
  );
}

export function CinematicVideoFrame({ assetId, className, priority = false, overlay }: MediaFrameProps) {
  const asset = getMediaAsset(assetId);
  const hasVideo = Boolean(asset.sourcePath);
  return (
    <figure className={cn("relative isolate overflow-hidden bg-[#050B14]", ratioClass(asset.aspectRatio), className)}>
      {hasVideo ? (
        <video
          src={asset.sourcePath}
          poster={asset.fallbackAsset}
          autoPlay
          muted
          loop
          playsInline
          preload={priority ? "auto" : "metadata"}
          aria-label={asset.altText}
          className="h-full w-full object-cover motion-reduce:hidden"
          style={{ objectPosition: asset.objectPosition ?? "center center" }}
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.fallbackAsset}
        alt={asset.altText}
        loading={priority ? "eager" : "lazy"}
        className={cn("h-full w-full object-cover", hasVideo && "motion-safe:hidden")}
        style={{ objectPosition: asset.objectPosition ?? "center center" }}
      />
      <PlaceholderLabel asset={asset} />
      {overlay}
    </figure>
  );
}

export function MediaPlaceholder(props: MediaFrameProps) {
  const asset = getMediaAsset(props.assetId);
  return asset.type === "video" ? <CinematicVideoFrame {...props} /> : <ResponsiveImageFrame {...props} />;
}

export function AircraftMediaPanel(props: MediaFrameProps) {
  return <ResponsiveImageFrame {...props} className={cn("rounded-lg border border-white/[0.10]", props.className)} />;
}

export function MediaWithPoster(props: MediaFrameProps) {
  return <CinematicVideoFrame {...props} />;
}
