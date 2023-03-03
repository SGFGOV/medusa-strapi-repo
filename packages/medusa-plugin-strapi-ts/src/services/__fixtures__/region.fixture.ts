export const mockedRegionBootStrapData = [
	{
		name: 'default',
		tax_rate: 18,
		tax_code: null,
		metadata: null,
		countries: [
			{
				id: 102,
				iso_2: 'in',
				iso_3: 'ind',
				num_code: 356,
				name: 'INDIA',
				display_name: 'India',
				region_id: 'reg_01GQS2PC0HE0H4BZHN3AW4PEZK',
			},
		],
		payment_providers: [
			{
				id: 'razorpay',
				is_installed: true,
			},
			{
				id: 'manual',
				is_installed: true,
			},
		],
		fulfillment_providers: [
			{
				id: 'manual',
				is_installed: true,
			},
		],
		currency: {
			code: 'inr',
			symbol: 'Rs',
			symbol_native: 'টকা',
			name: 'Indian Rupee',
			includes_tax: false,
		},
		id: 'reg_01GQS2PC0HE0H4BZHN3AW4PEZK',
	},
];

export const mockedRegionBootStrapTranslatedData = [
	{
		name: 'default',
		tax_rate: 18,
		tax_code: null,
		metadata: null,
		countries: [
			{
				medusa_id: 102,
				iso_2: 'in',
				iso_3: 'ind',
				num_code: 356,
				name: 'INDIA',
				display_name: 'India',
				region_id: 'reg_01GQS2PC0HE0H4BZHN3AW4PEZK',
			},
		],
		payment_providers: [
			{
				medusa_id: 'razorpay',
				is_installed: true,
			},
			{
				medusa_id: 'manual',
				is_installed: true,
			},
		],
		fulfillment_providers: [
			{
				medusa_id: 'manual',
				is_installed: true,
			},
		],
		currency: {
			code: 'inr',
			symbol: 'Rs',
			symbol_native: 'টকা',
			name: 'Indian Rupee',
			includes_tax: false,
		},
		medusa_id: 'reg_01GQS2PC0HE0H4BZHN3AW4PEZK',
	},
];
