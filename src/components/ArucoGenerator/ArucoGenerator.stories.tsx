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

export const WithoutTools: Story = {
  args: { showSaveButton: false, showPrintButton: false },
};

export const WithFooter: Story = {
  args: {
    footer: (
      <span>
        Dictionaries from{' '}
        <a href="https://github.com/okalachev/arucogen">arucogen</a> / OpenCV.
      </span>
    ),
  },
};

export const IdClampsOnDictionaryChange: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const idInput = canvas.getByLabelText('Marker ID:');
    await userEvent.clear(idInput);
    await userEvent.type(idInput, '999');
    await expect(idInput).toHaveValue(999);

    await userEvent.selectOptions(canvas.getByLabelText('Dictionary:'), 'april_16h5');
    await expect(idInput).toHaveValue(29);
    await expect(idInput).toHaveAttribute('max', '29');
    await expect(canvas.getByRole('img', { name: 'april_16h5 marker 29' })).toBeVisible();
    await expect(args.onChange).toHaveBeenLastCalledWith({ dictionary: 'april_16h5', id: 29, sizeMm: 100 });
  },
};

export const SaveLink: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole('link', { name: 'Save' });
    await expect(link).toHaveAttribute('download', '4x4_1000-0.svg');
    await expect(link.getAttribute('href')).toMatch(/^data:image\/svg\+xml;base64,/);
  },
};

export const SizeAppliesToSvg: Story = {
  play: async ({ canvas, userEvent }) => {
    const sizeInput = canvas.getByLabelText('Marker size, mm:');
    await userEvent.clear(sizeInput);
    await userEvent.type(sizeInput, '250');
    const svg = canvas.getByRole('img', { name: '4x4_1000 marker 0' });
    await expect(svg).toHaveAttribute('width', '250mm');
  },
};
