import {
    ChatInputCommandInteraction,
    Client,
    EmbedBuilder,
    GatewayIntentBits,
    Guild,
    Interaction,
    PermissionFlagsBits,
    SlashCommandBuilder,
    TextChannel,
    VoiceChannel
} from 'discord.js';
import {Program} from "./dimitri";
import * as fs from 'fs';

export class Discord {
    public constructor() {
        this._client = new Client({intents: [GatewayIntentBits.Guilds]});
    }

    private _guild: Guild;
    private _channel: VoiceChannel;
    private _log: TextChannel;
    private _client: Client;

    public async kickUsersFromVoice(): Promise<void> {
        return new Promise(resolve => {
            let count = this._channel.members.size;
            this._channel.members.forEach(async x => {
                await x.voice.disconnect("Sleeping time 💤");
                await this.sendMessage(`Disconnected <@${x.id}> from voice.`);
                console.log(`Kicked ${x.user.username} from voice.`);
                count--;

                if (count == 0) resolve();
            });
        });
    }

    public async sendMessage(message: string): Promise<void> {
        await this._log.send({embeds: [{description: message, color: 0x000000}]});
    }

    public async registerCommand(): Promise<void> {
        const scheduleCommand = new SlashCommandBuilder()
            .setName('schedule')
            .setDescription('Get the current schedule')
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .setDMPermission(false)
            .addSubcommand(subcommand =>
                subcommand
                    .setName('set')
                    .setDescription('Set the schedule')
                    .addIntegerOption(option =>
                        option.setName('hour')
                            .setDescription('Hour to set')
                            .setRequired(true))
                    .addIntegerOption(option =>
                        option.setName('minute')
                            .setDescription('Minute to set')
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('get')
                    .setDescription('Get the current schedule'))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('now')
                    .setDescription('Executes the scheduled task immediately'));

        await this._guild.commands.fetch();
        if (this._guild.commands.cache.filter(x => x.name == scheduleCommand.name).size > 0) {
            console.log('Schedule command already exists.');
            return;
        }

        await this._guild.commands.create(scheduleCommand);
        console.log('Registered the schedule command.');
    }

    public async start(): Promise<void> {
        return new Promise(resolve => {
            this._client.on('ready', async () => {
                console.log(`Logged in as ${this._client.user.tag}!`);
                this._guild = await this._client.guilds.fetch('844528630587850782');
                this._channel = await this._guild.client.channels.fetch('1213624723964043265') as VoiceChannel;
                this._log = await this._guild.client.channels.fetch('1171835210900447232') as TextChannel;
                console.log('Fetch of all necessary data complete.');
                await this.registerCommand();
                resolve();
            });

            this._client.on('interactionCreate', async interaction => {
                await this.onInteractionCreated(interaction);
            });

            console.log('Logging in...');
            const json = fs.readFileSync('token.json');
            const { token } = JSON.parse(json.toString());
            this._client.login(token);
        });
    }

    private async onInteractionCreated(interaction: Interaction) {
        if (!interaction.isCommand()) return;

        const {commandName} = interaction;
        if (commandName !== 'schedule') return;
        if (!interaction.isChatInputCommand()) return;

        const subcommand = (interaction as ChatInputCommandInteraction).options.getSubcommand();
        if (subcommand === 'get')
            await this.onGetCommandExecuted(interaction);

        if (subcommand === 'set')
            await this.onSetCommandExecuted(interaction);
        
        if (subcommand === 'now')
            await this.onNowCommandExecuted(interaction);
    }

    private async onSetCommandExecuted(interaction: ChatInputCommandInteraction) {
        const hour = interaction.options.getInteger('hour');
        const minute = interaction.options.getInteger('minute');
        Program.instance.schedule.setTime(hour, minute);

        const embed = new EmbedBuilder()
            .setDescription(`✅ Schedule set to: \`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}\`.`)
            .setColor('#000000');

        await interaction.reply({embeds: [embed], ephemeral: true});
    }

    private async onGetCommandExecuted(interaction: ChatInputCommandInteraction) {
        const hour = Program.instance.schedule.hour;
        const minute = Program.instance.schedule.minute;

        const embed = new EmbedBuilder()
            .setDescription(`⏰ Current Schedule: \`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}\`.`)
            .setColor('#000000');

        await interaction.reply({embeds: [embed], ephemeral: true});
    }

    private async onNowCommandExecuted(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });
        
        await Program.instance.schedule.callback();
        
        const embed = new EmbedBuilder()
            .setDescription(`✅ Action has been executed.`)
            .setColor('#000000');

        await interaction.followUp({embeds: [embed], ephemeral: true});
    }
}
 