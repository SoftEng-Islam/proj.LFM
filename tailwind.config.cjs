/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./index.html', './src/**/*.{ts,vue}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['"Segoe UI Variable"', '"Segoe UI"', 'system-ui', 'sans-serif'],
				display: ['"Segoe UI Variable"', '"Segoe UI"', 'system-ui', 'sans-serif'],
			},
			colors: {
				win: {
					blue: '#0067c0',
					'blue-hover': '#1975c8',
					'blue-active': '#005aad',
					'blue-subtle': '#cce4f7',
					'blue-subtle-dark': '#1a3a5c',
					bg: '#f3f3f3',
					'bg-dark': '#202020',
					panel: '#ffffff',
					'panel-dark': '#2b2b2b',
					sidebar: '#f3f3f3',
					'sidebar-dark': '#202020',
					'sidebar-hover': 'rgba(0,0,0,0.06)',
					'sidebar-hover-dark': 'rgba(255,255,255,0.06)',
					'sidebar-active': 'rgba(0,103,192,0.12)',
					border: 'rgba(0,0,0,0.08)',
					'border-dark': 'rgba(255,255,255,0.08)',
					toolbar: '#eeeeee',
					'toolbar-dark': '#2b2b2b',
					'text': '#1a1a1a',
					'text-muted': '#5c5c5c',
					'text-dark': '#f3f3f3',
					'text-muted-dark': '#9d9d9d',
				},
			},
			boxShadow: {
				'win-menu': '0 4px 16px rgba(0,0,0,0.18)',
				'win-panel': '0 2px 8px rgba(0,0,0,0.10)',
			},
			borderRadius: {
				'win': '4px',
				'win-lg': '8px',
				'win-menu': '8px',
			},
		},
	},
	plugins: [require('daisyui')],
	daisyui: {
		themes: ['light'],
	},
};
