'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _globby = require('globby');

var _globby2 = _interopRequireDefault(_globby);

var _qgenError = require('./lib/qgen-error');

var _qgenError2 = _interopRequireDefault(_qgenError);

var _templateRenderer = require('./lib/template-renderer');

var _templateRenderer2 = _interopRequireDefault(_templateRenderer);

var _templateFileRenderer = require('./lib/template-file-renderer');

var _templateFileRenderer2 = _interopRequireDefault(_templateFileRenderer);

var _fileHelpers = require('./lib/file-helpers');

var _promptHelpers = require('./lib/prompt-helpers');

var _configHelpers = require('./lib/config-helpers');

var _constants = require('./constants');

var _constants2 = _interopRequireDefault(_constants);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            * @module qgen
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            */


const DEFAULT_DESTINATION = './';

const renderAndSaveFile = (files, config) => {
	files.forEach(f => (0, _templateFileRenderer2.default)(f.src, config).save(f.dest));
};

const enquireToOverwrite = (fileObjects, overwriteAll) => {
	const enquireFileAtIndex = (() => {
		var _ref = _asyncToGenerator(function* (index, fileObjects, overwriteAll) {
			if (!fileObjects[index]) {
				return Promise.resolve([]);
			}

			let fileObj = fileObjects[index];
			let overwriteRest;

			if (!overwriteAll) {
				const answer = yield (0, _promptHelpers.promptIfFileExists)(fileObjects[index].dest);
				if (answer.overwrite === _constants2.default.ABORT) {
					return Promise.resolve([{ abort: true }]);
				}

				if (answer.overwrite === _constants2.default.SKIP) {
					fileObj = null;
				}

				overwriteRest = answer.overwrite === _constants2.default.OVERWRITE_ALL;
			}

			return [fileObj, ...(yield enquireFileAtIndex(index + 1, fileObjects, overwriteAll || overwriteRest))].filter(Boolean);
		});

		return function enquireFileAtIndex(_x, _x2, _x3) {
			return _ref.apply(this, arguments);
		};
	})();

	return enquireFileAtIndex(0, fileObjects, overwriteAll);
};

/**
 * Creates new qgen object
 * @param {Object} options - Options such as dest, config file path etc.
 * @returns {qgen} qgen object
 */
function qgen(options) {
	const defaultOptions = {
		dest: DEFAULT_DESTINATION,
		cwd: process.cwd(),
		directory: 'qgen-templates',
		config: './qgen.json',
		helpers: undefined,
		force: false
	};

	const configfilePath = (0, _configHelpers.createConfigFilePath)(defaultOptions, options);
	const configfileOptions = (0, _configHelpers.loadConfig)(configfilePath);
	const config = Object.assign(defaultOptions, configfileOptions, options);

	/** Throw error if qgen template directory is missing */
	if ((0, _fileHelpers.isFileOrDir)(config.directory) !== 'directory') {
		throw new _qgenError2.default(`qgen templates directory '${config.directory}' not found.`);
	}

	/**
  * Lists the available template names
  *
  * @return {Array} available template names
  */
	const templates = () => {
		return _globby2.default.sync(['*'], {
			cwd: _path2.default.join(config.cwd, config.directory),
			expandDirectories: false,
			onlyFiles: false
		});
	};

	/**
  * Render the template file and save to the destination path
  * @param  {String} template The name of the template
  * @param  {String} destination Destination path
  */
	const render = (() => {
		var _ref2 = _asyncToGenerator(function* (template, destination) {
			const templatePath = _path2.default.join(config.directory, template);
			const templateType = (0, _fileHelpers.isFileOrDir)(_path2.default.join(config.cwd, templatePath));
			const templateConfig = (0, _configHelpers.createTemplateConfig)(config, template, DEFAULT_DESTINATION);
			const filepathRenderer = (0, _templateRenderer2.default)({
				helpers: config.helpers,
				cwd: config.cwd
			});

			// Override config dest with passed destination
			if (destination) {
				templateConfig.dest = destination;
			}

			let fileObjects;

			if (templateType === 'directory') {
				const files = _globby2.default.sync(['**/*'], {
					cwd: _path2.default.join(config.cwd, templatePath),
					nodir: true
				});

				fileObjects = files.map(function (filePath) {
					return {
						src: _path2.default.join(templatePath, filePath),
						dest: _path2.default.join(templateConfig.cwd, templateConfig.dest, filepathRenderer.render(filePath, config))
					};
				});
			} else if (templateType === 'file') {
				fileObjects = [{
					src: templatePath,
					dest: _path2.default.join(templateConfig.cwd, templateConfig.dest, template)
				}];
			} else {
				throw new _qgenError2.default(`Template '${templatePath}' not found.`);
			}

			const filesForRender = yield enquireToOverwrite(fileObjects, config.force);

			if (!filesForRender.some(function (f) {
				return f.abort;
			})) {
				renderAndSaveFile(filesForRender, templateConfig);
			}
		});

		return function render(_x4, _x5) {
			return _ref2.apply(this, arguments);
		};
	})();

	return Object.freeze({
		templates,
		render
	});
}

module.exports = qgen;