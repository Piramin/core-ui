
import CanvasView from 'demoPage/views/CanvasView';

export default function () {
    const model = new Backbone.Model({
        selected: ['user.1']
    });

    return new CanvasView({
        view: new core.form.editors.MembersSplitPanelEditor({
            model,
            key: 'selected',
            autocommit: true,
            users: Core.services.UserService.listUsers(),
            groups: Core.services.UserService.listGroups()
        }),
        presentation: '\'{{memberValue}}\'',
        isEditor: true
    });
}
