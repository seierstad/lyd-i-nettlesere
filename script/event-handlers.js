const noop = event => {
    console.log(event.target);
    console.log(event.type);
    event.preventDefault();
    event.stopPropagation();
};

export {
    noop
};
