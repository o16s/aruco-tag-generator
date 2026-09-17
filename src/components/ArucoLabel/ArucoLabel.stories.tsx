import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArucoLabel } from './ArucoLabel';

const meta = {
  component: ArucoLabel,
  args: {
    dictionary: '4x4_1000',
    id: 42,
    widthMm: 63.5,
    heightMm: 38.1,
    digits: 4,
    cutLines: true,
    style: { width: 400, height: 'auto' },
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof ArucoLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Avery L7160: marker left, ID right, font shrunk so four digits fit. */
export const Rectangular: Story = {};

/** Wide label with a short range: the ID is as tall as the marker. */
export const WideOneDigit: Story = {
  args: { widthMm: 99.1, heightMm: 33.9, id: 7, digits: 1 },
};

/** Near-square label: ID below the marker. */
export const NearSquare: Story = {
  args: { widthMm: 63.5, heightMm: 72, dictionary: 'april_36h11', id: 586, digits: 3 },
};

/** Tiny label with the 2 mm quiet-zone floor. */
export const Tiny: Story = {
  args: { widthMm: 38.1, heightMm: 21.2, dictionary: '7x7_1000', id: 999, digits: 3, style: { width: 300, height: 'auto' } },
};
