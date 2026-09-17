import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { ArucoSheetGenerator } from './ArucoSheetGenerator';

const meta = {
  component: ArucoSheetGenerator,
  args: {
    onChange: fn(),
  },
  tags: ['ai-generated'],
} satisfies Meta<typeof ArucoSheetGenerator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SmallLabels: Story = {
  args: { defaultSheet: 'L7651', defaultTo: 64, defaultDictionary: 'april_36h11' },
};

export const NearSquareLabels: Story = {
  args: { defaultSheet: 'L7164', defaultTo: 11 },
};

export const CustomSize: Story = {
  args: { defaultSheet: 'custom', defaultTo: 23 },
};

export const RangeAndPages: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByText('21 per page · 1 page · marker 28.6 mm')).toBeVisible();

    const toInput = canvas.getByLabelText('To');
    await userEvent.clear(toInput);
    await userEvent.type(toInput, '41');
    await expect(canvas.getByText('21 per page · 2 pages · marker 28.6 mm')).toBeVisible();
    await expect(canvas.getByText('Page 1 of 2')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(canvas.getByText('Page 2 of 2')).toBeVisible();
    await expect(canvas.getByRole('img', { name: 'Label sheet page 2 of 2' })).toBeVisible();
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.objectContaining({ from: 0, to: 41 }));

    // A reversed range is swapped.
    const fromInput = canvas.getByLabelText('From');
    await userEvent.clear(fromInput);
    await userEvent.type(fromInput, '50');
    await expect(fromInput).toHaveValue(41);
    await expect(toInput).toHaveValue(50);
  },
};

export const SwitchToCustom: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getByLabelText('Label sheet'), 'custom');
    await expect(canvas.getByLabelText('Width')).toHaveValue(50);
    await expect(canvas.getByLabelText('Cut lines')).toBeChecked();
    await expect(canvas.getByText(/24 per page/)).toBeVisible();

    const width = canvas.getByLabelText('Width');
    await userEvent.clear(width);
    await userEvent.type(width, '300');
    await expect(canvas.getByRole('alert')).toHaveTextContent('does not fit on A4');
    await expect(canvas.getByRole('button', { name: 'Print / PDF' })).toBeDisabled();
  },
};
