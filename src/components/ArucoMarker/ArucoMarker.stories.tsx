import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { ArucoMarker } from './ArucoMarker';
import { ARUCO_DICTIONARIES } from '../../lib/aruco/dictionaries';

const meta = {
  component: ArucoMarker,
  args: {
    dictionary: '4x4_1000',
    id: 0,
    sizeMm: 100,
    fixPdfArtifacts: true,
  },
  argTypes: {
    dictionary: {
      control: 'select',
      options: ARUCO_DICTIONARIES.map((dictionary) => dictionary.name),
    },
    id: { control: { type: 'number', min: 0, step: 1 } },
    sizeMm: { control: { type: 'number', min: 10, max: 5000 } },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof ArucoMarker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const svg = canvas.getByRole('img', { name: '4x4_1000 marker 0' });
    await expect(svg.getAttribute('viewBox')).toBe('0 0 6 6');
    await expect(svg.getAttribute('width')).toBe('100mm');
    await expect(svg.querySelectorAll('rect[fill="white"]').length).toBeGreaterThan(0);
  },
};

export const AprilTag36h11: Story = {
  args: { dictionary: 'april_36h11', id: 42 },
};

export const OriginalAruco: Story = {
  args: { dictionary: 'aruco', id: 1023 },
};

export const NoPdfFix: Story = {
  args: { fixPdfArtifacts: false },
};

export const ScalesToContainer: Story = {
  args: { sizeMm: undefined, style: { width: 240, height: 240 } },
};

export const AllDictionaries: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 120px)', gap: 16 }}>
      {ARUCO_DICTIONARIES.map((dictionary) => (
        <figure key={dictionary.name} style={{ margin: 0, textAlign: 'center', fontSize: 12 }}>
          <ArucoMarker {...args} dictionary={dictionary.name} sizeMm={undefined} style={{ width: 120, height: 120 }} />
          <figcaption>{dictionary.label}</figcaption>
        </figure>
      ))}
    </div>
  ),
};
