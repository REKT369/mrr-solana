use anchor_lang::prelude::*;

// TEMP: placeholder ID, will be replaced after deploy
declare_id!("61cVB9Sj5dWWGk5fUfPCCvwpRtpMds2QW4Q5G7UqaDYV");

const MAX_URI_LEN: usize = 128;
const MAX_HANDLE_LEN: usize = 32;

#[program]
pub mod mrr_program {
    use super::*;

    /// Initialize a new Message Routing Record (MRR) for the owner.
    pub fn init_mrr(
        ctx: Context<InitMrr>,
        enc_pubkey: [u8; 32],
        primary_relay_uri: String,
        backup_relay_uri: String,
        handle: String,
        capabilities: u32,
    ) -> Result<()> {
        // Basic length checks for strings
        require!(
            primary_relay_uri.len() <= MAX_URI_LEN,
            MrrError::RelayUriTooLong
        );
        require!(
            backup_relay_uri.len() <= MAX_URI_LEN,
            MrrError::RelayUriTooLong
        );
        require!(handle.len() <= MAX_HANDLE_LEN, MrrError::HandleTooLong);

        let mrr = &mut ctx.accounts.mrr;

        mrr.owner = ctx.accounts.owner.key();
        mrr.enc_pubkey = enc_pubkey;
        mrr.prev_enc_pubkey = [0u8; 32]; // no previous key on first init
        mrr.primary_relay_uri = primary_relay_uri;
        mrr.backup_relay_uri = backup_relay_uri;
        mrr.handle = handle;
        mrr.capabilities = capabilities;
        mrr.updated_at = Clock::get()?.unix_timestamp;
        mrr.bump = ctx.bumps.mrr;

        emit!(MrrUpdated {
            owner: mrr.owner,
            enc_pubkey: mrr.enc_pubkey,
            prev_enc_pubkey: mrr.prev_enc_pubkey,
            primary_relay_uri: mrr.primary_relay_uri.clone(),
            backup_relay_uri: mrr.backup_relay_uri.clone(),
            handle: mrr.handle.clone(),
            capabilities: mrr.capabilities,
            updated_at: mrr.updated_at,
        });

        Ok(())
    }

    /// Update an existing MRR. All fields are optional; only provided ones are changed.
    pub fn update_mrr(
        ctx: Context<UpdateMrr>,
        new_enc_pubkey: Option<[u8; 32]>,
        new_primary_relay_uri: Option<String>,
        new_backup_relay_uri: Option<String>,
        new_handle: Option<String>,
        new_capabilities: Option<u32>,
    ) -> Result<()> {
        let mrr = &mut ctx.accounts.mrr;

        // If new encryption key provided, rotate: move current -> prev, set new -> current
        if let Some(k) = new_enc_pubkey {
            mrr.prev_enc_pubkey = mrr.enc_pubkey;
            mrr.enc_pubkey = k;
        }

        if let Some(uri) = new_primary_relay_uri {
            require!(uri.len() <= MAX_URI_LEN, MrrError::RelayUriTooLong);
            mrr.primary_relay_uri = uri;
        }

        if let Some(uri) = new_backup_relay_uri {
            require!(uri.len() <= MAX_URI_LEN, MrrError::RelayUriTooLong);
            mrr.backup_relay_uri = uri;
        }

        if let Some(h) = new_handle {
            require!(h.len() <= MAX_HANDLE_LEN, MrrError::HandleTooLong);
            mrr.handle = h;
        }

        if let Some(caps) = new_capabilities {
            mrr.capabilities = caps;
        }

        mrr.updated_at = Clock::get()?.unix_timestamp;

        emit!(MrrUpdated {
            owner: mrr.owner,
            enc_pubkey: mrr.enc_pubkey,
            prev_enc_pubkey: mrr.prev_enc_pubkey,
            primary_relay_uri: mrr.primary_relay_uri.clone(),
            backup_relay_uri: mrr.backup_relay_uri.clone(),
            handle: mrr.handle.clone(),
            capabilities: mrr.capabilities,
            updated_at: mrr.updated_at,
        });

        Ok(())
    }

    /// Close the MRR account and return rent to owner.
    pub fn close_mrr(_ctx: Context<CloseMrr>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitMrr<'info> {
    /// Owner of the MRR and payer for the account creation.
    #[account(mut)]
    pub owner: Signer<'info>,

    /// PDA account: seeds = ["mrr", owner]
    #[account(
        init,
        payer = owner,
        space = Mrr::space(),
        seeds = [b"mrr", owner.key().as_ref()],
        bump,
    )]
    pub mrr: Account<'info, Mrr>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMrr<'info> {
    /// Owner must sign to update their MRR.
    #[account(mut)]
    pub owner: Signer<'info>,

    /// Existing MRR PDA for the owner.
    #[account(
        mut,
        seeds = [b"mrr", owner.key().as_ref()],
        bump = mrr.bump,
        has_one = owner,
    )]
    pub mrr: Account<'info, Mrr>,
}

#[derive(Accounts)]
pub struct CloseMrr<'info> {
    /// Owner receives the reclaimed rent.
    #[account(mut)]
    pub owner: Signer<'info>,

    /// MRR PDA to be closed.
    #[account(
        mut,
        close = owner,
        seeds = [b"mrr", owner.key().as_ref()],
        bump = mrr.bump,
        has_one = owner,
    )]
    pub mrr: Account<'info, Mrr>,
}

#[account]
pub struct Mrr {
    pub owner: Pubkey,
    pub enc_pubkey: [u8; 32],
    pub prev_enc_pubkey: [u8; 32],
    pub primary_relay_uri: String,
    pub backup_relay_uri: String,
    pub handle: String,
    pub capabilities: u32,
    pub updated_at: i64,
    pub bump: u8,
}

impl Mrr {
    pub fn space() -> usize {
        // Anchor account discriminator
        let disc = 8;
        let owner = 32;
        let enc_pubkey = 32;
        let prev_enc_pubkey = 32;
        // Strings are stored as a 4-byte length prefix + bytes
        let primary_relay_uri = 4 + MAX_URI_LEN;
        let backup_relay_uri = 4 + MAX_URI_LEN;
        let handle = 4 + MAX_HANDLE_LEN;
        let capabilities = 4;
        let updated_at = 8;
        let bump = 1;

        disc
            + owner
            + enc_pubkey
            + prev_enc_pubkey
            + primary_relay_uri
            + backup_relay_uri
            + handle
            + capabilities
            + updated_at
            + bump
    }
}

#[event]
pub struct MrrUpdated {
    pub owner: Pubkey,
    pub enc_pubkey: [u8; 32],
    pub prev_enc_pubkey: [u8; 32],
    pub primary_relay_uri: String,
    pub backup_relay_uri: String,
    pub handle: String,
    pub capabilities: u32,
    pub updated_at: i64,
}

#[error_code]
pub enum MrrError {
    #[msg("Relay URI is too long")]
    RelayUriTooLong,
    #[msg("Handle is too long")]
    HandleTooLong,
}

