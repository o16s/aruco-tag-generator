import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { expect, waitFor } from 'storybook/test';
import { markerSvgDataUri, markerSvgString } from '../../lib/aruco/marker';
import { ArucoScanner } from './ArucoScanner';

const meta = {
  component: ArucoScanner,
  tags: ['ai-generated'],
} satisfies Meta<typeof ArucoScanner>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Needs a device with a camera and HTTPS (or localhost). */
export const CameraLive: Story = {};

/**
 * A marker rendered in perspective (tilted back and turned) and rasterised to a canvas, so the
 * detector and the gizmo can be exercised without a camera.
 */
function SyntheticScene({ tiltX, turnY }: { tiltX: number; turnY: number }) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const el = document.createElement('canvas');
      el.width = 960;
      el.height = 720;
      const ctx = el.getContext('2d')!;
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, el.width, el.height);
      // Perspective by hand: project the marker's square with a pinhole camera and draw it as
      // a textured quad made of thin horizontal strips (canvas 2D has no 3D transform).
      const f = 800;
      const cx = el.width / 2;
      const cy = el.height / 2;
      const size = 240;
      const rx = (tiltX * Math.PI) / 180;
      const ry = (turnY * Math.PI) / 180;
      const project = (u: number, v: number) => {
        // marker plane point (u right, v up) → rotate about X then Y → camera at z=900
        let x = u;
        let y = v * Math.cos(rx);
        let z = -v * Math.sin(rx);
        const x2 = x * Math.cos(ry) + z * Math.sin(ry);
        z = -x * Math.sin(ry) + z * Math.cos(ry);
        x = x2;
        z += 900;
        return { x: cx + (f * x) / z, y: cy - (f * y) / z };
      };
      const steps = 240;
      for (let i = 0; i < steps; i++) {
        const v0 = size / 2 - (i * size) / steps;
        const v1 = size / 2 - ((i + 1) * size) / steps;
        const a = project(-size / 2, v0);
        const b = project(size / 2, v0);
        const c = project(-size / 2, v1);
        // affine strip: source row i of the image maps to the segment a→b, next row to c
        const sy = (i * image.height) / steps;
        const sh = image.height / steps + 1;
        ctx.save();
        ctx.setTransform((b.x - a.x) / image.width, (b.y - a.y) / image.width, (c.x - a.x) / (image.height / steps), (c.y - a.y) / (image.height / steps), a.x, a.y);
        ctx.drawImage(image, 0, sy, image.width, sh, 0, 0, image.width, image.height / steps + 1);
        ctx.restore();
      }
      setCanvas(el);
    };
    image.src = markerSvgDataUri(markerSvgString('4x4_1000', 42, { fixPdfArtifacts: false, sizeMm: 100 }).replace('width="100mm" height="100mm"', 'width="600" height="600"'));
  }, [tiltX, turnY]);
  return canvas ? <ArucoScanner source={canvas} /> : <p>Rendering scene…</p>;
}

export const SyntheticImage: Story = {
  render: () => <SyntheticScene tiltX={35} turnY={-20} />,
  play: async ({ canvas }) => {
    await waitFor(() => expect(canvas.getByText(/ID 42 · 4x4_1000 · \d\.\d\d m/)).toBeVisible(), { timeout: 10000 });
    await expect(canvas.getByText(/ID 42 · 4x4_1000/)).toHaveAttribute('data-detections', '1');
  },
};

export const SyntheticFrontal: Story = {
  render: () => <SyntheticScene tiltX={0} turnY={0} />,
};
