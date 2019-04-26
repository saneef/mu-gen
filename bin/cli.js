#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const meow = require('meow');
const redent = require('redent');

const qgen = require('..');

const cli = meow(`
	${chalk.bold('Usage')}
		$ qgen <template name> [dest] [arguments] [options]

	${chalk.bold('Options')}
		-d, --directory <dir>	Templates directory (defaults to ./qgen-templates)
		-c, --config <path>	Path to the JSON config file (defaults to ./qgen.json)
		-f, --force		Overwrite the destination files
		-p, --preview	Preview the results without making any changes on files

	${chalk.bold('Examples')}
		$ qgen post ${chalk.dim('# generates the post template in the current folder')}
		$ qgen post ./pages ${chalk.dim('# generates the post template inside ./pages')}
		$ qgen post ./pages --page-title "Hello World" ${chalk.dim('# generates the post template in inside ./pages with data field pageTitle="Hello World" to the template rendering engine')}
`, {
	flags: {
		config: {
			alias: 'c'
		},
		directory: {
			type: 'string',
			alias: 'd'
		},
		force: {
			alias: 'f'
		},
		preview: {
			alias: 'p'
		}
	}
});

/**
 * Displays list of available templates to stdout
 *
 * @param  {Object} options - options for qgen
 * @return {undefined}
 */
const listTemplates = options => {
	try {
		const templates = qgen(options).templates();
		if (Array.isArray(templates) && templates.length > 0) {
			console.log(redent('	', 2)); // For one line space
			console.log(redent(`	${chalk.bold('Available Templates')}`, 2));
			templates.forEach(template => {
				console.log(redent(`${template}`, 4));
			});
		}
	} catch (error) {
		console.log(redent('	', 2)); // For one line space
		console.error(error.message);
		process.exit(2);
	}
};

if (cli.input.length === 0) {
	console.log(cli.help);
	listTemplates(cli.flags);
} else {
	try {
		qgen(cli.flags).render(cli.input[0], cli.input[1]);
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}
}
