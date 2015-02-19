/* global define */
define([
    'underscore',
    'marionette',
    'backbone.radio',
    'text!apps/notes/show/templates/item.html',
    'backbone.mousetrap'
], function(_, Marionette, Radio, Tmpl) {
    'use strict';

    /**
     * Note view.
     *
     * Triggers the following
     * Events:
     * 1. channel: noteView, event: view:render
     *    when the view is rendered and ready.
     * 2. channel: noteView, event: view:destroy
     *    before the view is destroyed.
     * Requests:
     * 1. channel: editor, request: content:html
     *    it expects to receive HTML.
     * 2. channel: global, request: configs
     */
    var View = Marionette.ItemView.extend({
        template: _.template(Tmpl),

        className: 'content-notes',

        ui: {
            favorite : '.favorite span',
            body     : '.ui-body',

            // Tasks
            tasks    : '.task [type="checkbox"]',
            progress : '.progress-bar',
            percent  : '.progress-percent',

            // Action buttons
            editBtn  : '.btn-edit',
            rmBtn    : '.btn-remove'
        },

        events: {
            'click @ui.favorite': 'favorite',
            'click @ui.tasks'   : 'toggleTask'
        },

        modelEvents: {
            'change:isFavorite'    : 'onChangeFavorite',
            'change:taskCompleted' : 'onTaskCompleted'
        },

        keyboardEvents: {
            /*
             * Scroll with up/down keys.
             * It is done to avoid an unexpected behaviour.
             */
            'up'   : 'scrollTop',
            'down' : 'scrollDown'
        },

        initialize: function() {
            var configs = Radio.request('global', 'configs');
            this.keyboardEvents[configs.actionsEdit]       = 'editNote';
            this.keyboardEvents[configs.actionsRemove]     = 'rmNote';
            this.keyboardEvents[configs.actionsRotateStar] = 'favorite';
        },

        onRender: function() {
            Radio.trigger('noteView', 'view:render');
        },

        onBeforeDestroy: function() {
            Radio.trigger('noteView', 'view:destroy');
        },

        scrollTop: function() {
            this.ui.body.scrollTop(this.ui.body.scrollTop() - 50);
            return false;
        },

        scrollDown: function() {
            this.ui.body.scrollTop(this.ui.body.scrollTop() + 50);
            return false;
        },

        editNote: function() {
            Radio.trigger('global', 'navigate:link', this.ui.editBtn.attr('href'));
        },

        rmNote: function() {
            Radio.trigger('global', 'navigate:link', this.ui.rmBtn.attr('href'));
        },

        /**
         * Changes favorite status of the note
         */
        favorite: function() {
            this.model.trigger('favorite:toggle');
            return false;
        },

        onChangeFavorite: function() {
            this.ui.favorite.toggleClass('icon-favorite', this.model.get('isFavorite'));
        },

        /**
         * Toggle the status of a task
         */
        toggleTask: function(e) {
            var $task = $(e.target),
                taskId = Number($task.attr('data-task'));

            this.trigger('toggle:task', taskId);
        },

        onTaskCompleted: function() {
            var percent = Math.floor(
                this.model.get('taskCompleted') * 100 / this.model.get('taskAll')
            );
            this.ui.progress.css({width: percent + '%'});
            this.ui.percent.html(percent + '%');
        },

        serializeData: function() {
            var content = Radio.request('editor', 'content:html', this.model.get('content'));
            return _.extend(this.model.toJSON(), {
                content  : content || this.model.get('content'),
                notebook : '',
                uri      : Radio.request('global', 'uri:link', '/')
            });
        },

        templateHelpers: function() {
            return {
                createdDate: function() {
                    return new Date(this.created).toLocaleDateString();
                },

                getProgress: function() {
                    return Math.floor(this.taskCompleted * 100 / this.taskAll);
                }
            };
        }
    });

    return View;

});
