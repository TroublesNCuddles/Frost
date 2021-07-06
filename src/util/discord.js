const addReactionWithNoCommitment = (message, reaction) => {
    message.react(reaction).catch(e => {
    });
};

const clearMessageAfterDuration = (message, duration = 5000) => {
    setTimeout(() => message.delete().catch(e => {
        console.log(e);
    }), duration)
}

module.exports = {
    addReactionWithNoCommitment,
    clearMessageAfterDuration
};