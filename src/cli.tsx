#!/usr/bin/env node
import { render } from 'ink';
import meow from 'meow';
import React from 'react';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ @parrot-app/server

	Options
		--bypass=[true|false]  Bypass the cache

	Examples
	  $ @parrot-app/server --bypass=true
`,
	{
		importMeta: import.meta,
		flags: {
			bypass: {
				type: 'boolean',
			},
		},
	},
);

cli;

render(<App />);
