export const TutorialRegistry = {
    refs: {},
    register: (id, ref) => {
        if (ref) {
            TutorialRegistry.refs[id] = ref;
        }
    },
    unregister: (id) => {
        delete TutorialRegistry.refs[id];
    },
    measure: (id) => {
        return new Promise((resolve) => {
            const el = TutorialRegistry.refs[id];
            if (el && el.measureInWindow) {
                el.measureInWindow((x, y, width, height) => {
                    resolve({ x, y, width, height });
                });
            } else {
                resolve(null);
            }
        });
    }
};
