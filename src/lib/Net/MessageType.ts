export enum MessageType
{
    // To host
    World = "World",
    Unit = "Unit",
    Diff = "Diff",
    Player = "Player",
    Kick = "Kick",
    Resources = "Resources",

    // To client
    Command = "Command",

    // To both
    Received = "Received"
}