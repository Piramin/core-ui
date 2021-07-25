import LocalizationService from '../../services/LocalizationService';
import _ from 'underscore';

export default () =>
    function(value) {
        if (value === null || value === undefined || value === false || value === '') {
            return;
        }

        const err = {
            type: 'uri',
            message: LocalizationService.get('CORE.FORM.EDITORS.URIEDITOR.MSGVALIDATORFTP')
        };
        if (!/^ftp:\/\//.test(value)) {
            return err;
        }
    };