const noop = event => {
    event.preventDefault();
    event.stopPropagation();
};

export {
    noop
};
