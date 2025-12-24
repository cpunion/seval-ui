import { render, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ShowcasePage } from './ShowcasePage'

function renderShowcase() {
	return render(<ShowcasePage />)
}

async function findTextFieldInput(labelText: string, root: ParentNode = document.body) {
	const label = await within(root).findByText(labelText)
	const textfield = label.closest('.a2ui-textfield') ?? label.parentElement
	if (!textfield) {
		throw new Error(`Unable to locate text field container for label: ${labelText}`)
	}
	return within(textfield).getByRole('textbox')
}

describe('ShowcasePage', () => {
	it('renders initial derived state from MiniJS runtime', async () => {
		const view = renderShowcase()
		const user = userEvent.setup()

		await within(view.container).findByRole('heading', { name: /a2ui component showcase/i })
		expect(await within(view.container).findByText('Count: 0')).toBeInTheDocument()
		expect(await within(view.container).findByText('Unchecked')).toBeInTheDocument()

		const todoTabButton = await within(view.container).findByRole('button', { name: 'Todo App' })
		await user.click(todoTabButton)

		expect(
			await within(view.container).findByText('1 of 3 completed', undefined, { timeout: 5000 }),
		).toBeInTheDocument()
	})

	it('updates counter and todos through UI actions', async () => {
		const view = renderShowcase()
		const user = userEvent.setup()

		await within(view.container).findByText('Count: 0')

		const incrementButtons = await within(view.container).findAllByRole('button', { name: '+' })
		await user.click(incrementButtons[incrementButtons.length - 1]!)

		await waitFor(() => {
			expect(within(view.container).getByText('Count: 1')).toBeInTheDocument()
		})

		const todoTabButton = await within(view.container).findByRole('button', { name: 'Todo App' })
		await user.click(todoTabButton)

		const todoInput = await findTextFieldInput('New todo:', view.container)
		await user.type(todoInput, 'Write Showcase tests')
		await user.click(await within(view.container).findByRole('button', { name: 'Add' }))

		await waitFor(() => {
			expect(within(view.container).getByText('Write Showcase tests')).toBeInTheDocument()
		})

		await waitFor(() => {
			expect(within(view.container).getByText('1 of 4 completed')).toBeInTheDocument()
		})
	})
})
