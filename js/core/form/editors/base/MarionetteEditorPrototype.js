/**
 * Developer: Stepan Burguchev
 * Date: 12/2/2014
 * Copyright: 2009-2016 Comindware®
 *       All Rights Reserved
 * Published under the MIT license
 */

/* global define, require, Handlebars, Backbone, Marionette, $, _ */

/*
*
* Marionette-based Backbone.Form editor. MUST NOT be used directly. Use EditorBase*View base views instead while implementing Marionette editors.
*
* */

"use strict";

import '../../../libApi';

const classes = {
    disabled: 'l-field_disabled',
    readonly: 'l-field_readonly',
    FOCUSED: 'l-field_focused',
    EMPTY: 'l-field_empty'
};

let onFocus = function () {
    this.$el.addClass(classes.FOCUSED);
    this.trigger('focus', this);
};

let onBlur = function () {
    this.$el.removeClass(classes.FOCUSED);
    this.trigger('blur', this);
};

let onRender = function () {
    this.$el.attr('id', this.id);
    this.$el.attr('name', this.getName());
    this.setPermissions(this.enabled, this.readonly);
    //noinspection JSUnresolvedVariable
    if (this.schema.editorClass) {
        //noinspection JSUnresolvedVariable
        this.$el.addClass(this.schema.editorClass);
    }
    if (this.schema.editorAttrs) {
        this.$el.attr(this.schema.editorAttrs);
    }
    this.setValue(this.value, true);
    if (this.focusElement) {
        this.$el.on('focus', this.focusElement, onFocus.bind(this));
        this.$el.on('blur', this.focusElement, onBlur.bind(this));
    } else {
        this.$el.on('focus', onFocus.bind(this));
        this.$el.on('blur', onBlur.bind(this));
    }
    this.$el.toggleClass(classes.EMPTY, this.isEmpty());
};

let onChange = function () {
    if (this.schema.autocommit) {
        this.commit({});
    }
    this.$el.toggleClass(classes.EMPTY, this.isEmpty());
};

/**
 * @name BaseEditorView
 * @memberof module:core.form.editors.base
 * @class Base class for all editors that use Marionette.View. The class is a reworked version of Backbone.Form.Editor from
 * [Backbone.Form](https://github.com/powmedia/backbone-forms) library.<br/>
 * While implementing editors, inherit from one of the following classes which in turn are inherited from this one:<ul>
 * <li><code>BaseCollectionEditorView</code></li>
 * <li><code>BaseCompositeEditorView</code></li>
 * <li><code>BaseLayoutEditorView</code></li>
 * <li><code>BaseItemEditorView</code></li></ul>
 * Possible events:<ul>
 * <li><code>'change' (thisEditorView)</code> - fires when the value inside the editor is changed.
 * This event doesn't imply any change in model (!).</li>
 * <li><code>'focus' (thisEditorView)</code> - fire when the editor gets the focus.</li>
 * <li><code>'blur' (thisEditorView)</code> - fire when the editor loses the focus.</li>
 * <li><code>'enabled' (enabled)</code> - fires when the property <code>enabled</code> is changed.</li>
 * <li><code>'readonly' (readonly)</code> - fires when the property <code>readonly</code> is changed.</li>
 * <li><code>'&lt;key&gt;:committed' (thisEditorView, model, value)</code> - fires when the value is committed into the model.</li>
 * <li><code>'value:committed' (thisEditorView, model, key, value)</code> - fires when the value is committed into the model.</li>
 * </ul>
 * @constructor
 * @extends Marionette.View
 * @param {Object} options Options object.
 * @param {Boolean} [options.autocommit=false] Indicates whether to call <code>commit()</code> method on the value change.
 * @param {Boolean} [options.forceCommit=false] Indicated whether to commit the value into the model if editors validation has failed (not recommended).
 * @param {Boolean} [options.enabled=true] The initial value of <code>enabled</code> flag. Can be changed later on by calling <code>setEnabled()</code> method.
 * @param {Boolean} [options.readonly=false] The initial value of <code>readonly</code> flag.
 *                                           Can be changed later on by calling <code>setReadonly()</code> method.
 * @param {Boolean} [options.model] A model which contains an attributes edited by this editor.
 *                                  Can only be used if the editor is created standalone (without a form).
*                                   Must be used together with  <code>key</code> options.
 * @param {Boolean} [options.key] The name of an attribute in <code>options.model</code> edited by this editor.
 *                                Can only be used if the editor is created standalone (without a form).
 *                                Must be used together with  <code>model</code> options.
 * @param {Function[]} [options.validators] An array of validator function which look like the following:
 * <code>function(value, formValues) -> ({type, message}|undefined)</code>
 * @param {Object} [options.schema] When created implicitly by form, all the editor options are passed through this option.
 * Не использовать явно.
 * */

export default {
    create: function(viewClass) {
        return /** @lends module:core.form.editors.base.BaseEditorView.prototype */ {
            defaultValue: null,

            /**
             * Indicates whether the editor has focus.
             * */
            hasFocus: false,

            constructor: function (options) {
                options = options || {};

                //Set initial value
                if (options.model) {
                    if (!options.key) {
                        throw new Error("Missing option: 'key'");
                    }

                    this.model = options.model;
                    this.value = this.model.get(options.key);
                }
                else if (options.value !== undefined) {
                    this.value = options.value;
                }

                if (this.value === undefined) {
                    this.value = this.defaultValue;
                }

                //Store important data
                _.extend(this, _.pick(options, 'key', 'form'));

                var schema = this.schema = options.schema || {};

                this.validators = options.validators || schema.validators;

                this.on('render', onRender.bind(this));
                this.on('change', onChange.bind(this));

                schema.autocommit = schema.autocommit || options.autocommit;

                this.enabled = schema.enabled = schema.enabled || options.enabled ||
                              (schema.enabled === undefined && options.enabled === undefined);
                this.readonly = schema.readonly = schema.readonly || options.readonly ||
                               (schema.readonly !== undefined && options.readonly !== undefined);
                schema.forceCommit = options.forceCommit || schema.forceCommit;

                viewClass.prototype.constructor.apply(this, arguments);
                if (this.model) {
                    this.listenTo(this.model, 'change:' + this.key, this.updateValue);
                    this.listenTo(this.model, 'sync', this.updateValue);
                }

                this.classes = classes;
            },

            /**
             * Manually updated editor's internal value with the value from <code>this.model.get(this.key)</code>.
             * Shouldn't be called normally. The method is called internally on model's <code>change</code> event.
             * */
            updateValue: function () {
                this.setValue(this.getModelValue());
            },

            /**
             * Retrieves actual value of the bound attribute from the model.
             * @return {*}
             * */
            getModelValue: function () {
                return !this.model ? undefined : this.model.get(this.key);
            },

            __getFocusElement: function () {
                if (this.focusElement) {
                    return this.$el.find(this.focusElement);
                } else {
                    return this.$el;
                }
            },

            __triggerChange: function () {
                this.trigger.apply(this, [ 'change', this].concat(arguments));
            },

            getName: function() {
                var key = this.key || '';

                //Replace periods with underscores (e.g. for when using paths)
                return key.replace(/\./g, '_');
            },

            /**
             * Returns internal editor's value.
             * @return {*}
             */
            getValue: function() {
                return this.value;
            },

            /**
             * Sets new internal editor's value.
             * @param {*} value The new value.
             */
            setValue: function(value) {
                this.value = value;
            },

            setPermissions: function (enabled, readonly) {
                this.__setEnabled(enabled);
                this.__setReadonly(readonly);
            },

            /**
             * Sets a new value of <code>enabled</code> flag. While disabled, the editor's value cannot be changed or copied by the user.
             * It's implied that the value doesn't make sense.
             * @param {Boolean} enabled New flag value.
             */
            setEnabled: function (enabled) {
                var readonly = this.getReadonly();
                this.setPermissions(enabled, readonly);
            },

            /**
             * Sets a new value of <code>readonly</code> flag. While readonly, the editor's value cannot be changed but can be copied by the user.
             * @param {Boolean} readonly New flag value.
             */
            setReadonly: function (readonly) {
                var enabled = this.getEnabled();
                this.setPermissions(enabled, readonly);
            },

            __setEnabled: function (enabled) {
                this.enabled = enabled;
                this.trigger('enabled', enabled);
                if (!this.enabled) {
                    this.$el.addClass(classes.disabled);
                } else {
                    this.$el.removeClass(classes.disabled);
                }
            },

            /**
             * Returns the value of `enabled` flag.
             * @return {Boolean}
             */
            getEnabled: function () {
                return this.enabled;
            },

            __setReadonly: function (readonly) {
                this.readonly = readonly;
                this.trigger('readonly', readonly);
                if (this.readonly && this.getEnabled()) {
                    this.$el.addClass(classes.readonly);
                } else {
                    this.$el.removeClass(classes.readonly);
                }
            },

            /**
             * Returns the value of `readonly` flag.
             * @return {Boolean}
             */
            getReadonly: function () {
                return this.readonly;
            },

            /**
             * Sets the focus onto this editor.
             */
            focus: function() {
                if (this.hasFocus) {
                    return;
                }
                this.__getFocusElement().focus();
            },

            /**
             * Clears the focus.
             */
            blur: function() {
                if (!this.hasFocus) {
                    return;
                }
                this.__getFocusElement().blur();
            },

            /**
             * Update the model with the internal editor's value.
             * @param {Object} [options] Options to pass to model.set().
             * @param {Boolean} [options.validate] Set to true to trigger built-in model validation.
             * @return {Object|undefined} Returns an error object <code>{ type, message }</code> if validation fails
             * and <code>options.forceCommit</code> is turned off. <code>undefined</code> otherwise.
             */
            commit: function(options) {
                options = options || {};
                var error = this.validate();
                if (error && !this.schema.forceCommit) {
                    return error;
                }

                this.listenTo(this.model, 'invalid', function(model, e) {
                    error = e;
                });

                this.model.set(this.key, this.getValue(), {
                    silent: false,
                    validate: options.validate === true
                });

                if (error && !this.schema.forceCommit) {
                    return error;
                }
                this.trigger(this.key + ':committed', this, this.model, this.getValue());
                this.trigger('value:committed', this, this.model, this.key, this.getValue());
            },

            isEmpty: function () {
                return !this.getValue();
            },

            /**
             * Check validity with built-in validator functions (initially passed into constructor options).
             * @return {Object|undefined} Returns an error object <code>{ type, message }</code> if validation fails. <code>undefined</code> otherwise.
             */
            validate: function() {
                var $el = this.$el,
                    error = null,
                    value = this.getValue(),
                    formValues = this.form ? this.form.getValue() : {},
                    validators = this.validators,
                    getValidator = this.getValidator;

                if (validators) {
                    //Run through validators until an error is found
                    _.every(validators, function(validator) {
                        error = getValidator(validator)(value, formValues);

                        return error ? false : true;
                    });
                }

                return error;
            },

            trigger: function(event) {
                if (event === 'focus') {
                    this.hasFocus = true;
                }
                else if (event === 'blur') {
                    this.hasFocus = false;
                }

                return Marionette.ItemView.prototype.trigger.apply(this, arguments);
            },

            getValidator: function(validator) {
                var validators = Backbone.Form.validators;

                //Convert regular expressions to validators
                if (_.isRegExp(validator)) {
                    return validators.regexp({ regexp: validator });
                }

                //Use a built-in validator if given a string
                if (_.isString(validator)) {
                    if (!validators[validator]) {
                        throw new Error('Validator "' + validator + '" not found');
                    }

                    return validators[validator]();
                }

                //Functions can be used directly
                if (_.isFunction(validator)) {
                    return validator;
                }

                //Use a customised built-in validator if given an object
                //noinspection JSUnresolvedVariable
                if (_.isObject(validator) && validator.type) {
                    var config = validator;

                    //noinspection JSUnresolvedVariable
                    return validators[config.type](config);
                }

                //Unknown validator type
                throw new Error('Invalid validator: ' + validator);
            }
        };
    }
};
