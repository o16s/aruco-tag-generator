import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { ArucoGenerator } from './ArucoGenerator';

const meta = {
  component: ArucoGenerator,
  args: {
    onChange: fn(),
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof ArucoGenerator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAprilTagDefault: Story = {
  args: { defaultDictionary: 'april_36h11', defaultId: 7, defaultSizeMm: 50 },
};

export const Themed: Story = {
  render: (args) => (
    <div style={{ '--atg-accent': '#0f766e', '--atg-radius': '2px', '--atg-surface-2': '#ecfdf5', fontFamily: 'Georgia, serif' } as React.CSSProperties}>
      <ArucoGenerator {...args} />
    </div>
  ),
};

export const NarrowContainer: Story = {
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <ArucoGenerator {...args} />
    </div>
  ),
};

export const StepperAndClamp: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const idInput = canvas.getByLabelText('Marker ID');
    await userEvent.click(canvas.getByRole('button', { name: 'Increase ID' }));
    await expect(idInput).toHaveValue(1);
    await expect(canvas.getByRole('img', { name: '4x4_1000 marker 1' })).toBeVisible();

    await userEvent.clear(idInput);
    await userEvent.type(idInput, '999');
    await userEvent.selectOptions(canvas.getByLabelText('Dictionary'), 'april_16h5');
    await expect(idInput).toHaveValue(29);
    await expect(idInput).toHaveAttribute('max', '29');
    await expect(canvas.getByRole('button', { name: 'Increase ID' })).toBeDisabled();
    await expect(args.onChange).toHaveBeenLastCalledWith({ dictionary: 'april_16h5', id: 29, sizeMm: 100 });
  },
};

export const DownloadLink: Story = {
  play: async ({ canvas, userEvent }) => {
    const link = canvas.getByRole('link', { name: 'Download SVG' });
    await expect(link).toHaveAttribute('download', '4x4_1000-0.svg');
    await expect(link.getAttribute('href')).toMatch(/^data:image\/svg\+xml;base64,/);

    const sizeInput = canvas.getByLabelText('Marker size');
    await userEvent.clear(sizeInput);
    await userEvent.type(sizeInput, '150');
    const svg = atob(link.getAttribute('href')!.split(',')[1]);
    await expect(svg).toContain('width="150mm"');
  },
};

export const RefusesOversizedMarker: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const sizeInput = canvas.getByLabelText('Marker size');
    await userEvent.clear(sizeInput);
    await userEvent.type(sizeInput, '300');
    await expect(canvas.getByRole('alert')).toHaveTextContent('300 mm does not fit on A4');
    await expect(sizeInput).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByRole('button', { name: 'Print / PDF' })).toBeDisabled();
    // Without an href the anchor is not a link any more, so it cannot download anything.
    await expect(canvas.getByText('Download SVG')).not.toHaveAttribute('href');
    await expect(canvas.getByText('Download SVG')).toHaveAttribute('aria-disabled', 'true');
    await expect(args.onChange).not.toHaveBeenCalledWith(expect.objectContaining({ sizeMm: 300 }));

    await userEvent.clear(sizeInput);
    await userEvent.type(sizeInput, '190');
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Print / PDF' })).toBeEnabled();
  },
};
