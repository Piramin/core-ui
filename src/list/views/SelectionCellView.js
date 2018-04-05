import template from '../templates/selectionCell.hbs';

const selectionTypes = {
    all: 'all',
    single: 'single'
};

const classes = {
    SELECTION_ALL: 'grid-selection-cell-all',
    CHECKED: 'editor_checked',
    CHECKED_SOME: 'editor_checked_some'
};

export default Marionette.ItemView.extend({
    initialize(options) {
        if (options.selectionType === selectionTypes.all) {
            this.collection = options.collection;
            this.listenTo(this.collection, 'check:all check:none check:some', this.__updateState);
        } else {
            this.listenTo(this.model, 'checked unchecked checked:some', this.__updateState);
        }
    },

    template: Handlebars.compile(template),

    className: 'grid-selection-cell',

    events: {
        click: '__handleClick'
    },

    modelEvents: {
        'update:top': '__updateTop'
    },

    onRender() {
        if (this.options.selectionType === selectionTypes.all) {
            this.el.classList.add(classes.SELECTION_ALL);
        }
        this.__updateState();
    },

    __handleClick() {
        if (this.options.selectionType === selectionTypes.all) {
            this.collection.toggleCheckAll();
        } else {
            this.model.toggleChecked();
        }
    },

    __updateTop(top) {
        this.el.style.top = top;
    },

    __updateState() {
        let state;
        if (this.options.selectionType === selectionTypes.all) {
            state = this.collection.checkedLength ? (this.collection.checkedLength === this.collection.length ? true : null) : false;
        } else {
            state = this.model.checked;
        }
        if (state) {
            this.el.classList.add(classes.CHECKED);
            this.el.classList.remove(classes.CHECKED_SOME);
        } else if (state === null) {
            this.el.classList.remove(classes.CHECKED);
            this.el.classList.add(classes.CHECKED_SOME);
        } else {
            this.el.classList.remove(classes.CHECKED);
            this.el.classList.remove(classes.CHECKED_SOME);
        }
    }
});
