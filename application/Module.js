/**
 * Developer: Stepan Burguchev
 * Date: 6/30/2015
 * Copyright: 2009-2015 Comindware®
 *       All Rights Reserved
 *
 * THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF Comindware
 *       The copyright notice above does not evidence any
 *       actual or intended publication of such source code.
 */

/* global define, require, Handlebars, Backbone, Marionette, $, _, Localizer */

define([
        'module/lib',
        'core/utils/utilsApi'
    ],
    function (lib, utilsApi) {
        'use strict';

        return Marionette.Controller.extend({
            constructor: function (options) {
                utilsApi.helpers.ensureOption(options, 'contentRegion');
                this.contentRegion = options.contentRegion;
                Marionette.Controller.prototype.constructor.apply(this, arguments);
            }
        });
    });
