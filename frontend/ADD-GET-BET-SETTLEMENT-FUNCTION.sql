-- Create function to get settlement details for a bet
-- Shows who owes who after bet resolution

CREATE OR REPLACE FUNCTION public.get_bet_settlement(p_bet_id UUID)
RETURNS TABLE (
    settlement_id UUID,
    payer_id UUID,
    payer_username TEXT,
    receiver_id UUID,
    receiver_username TEXT,
    amount INTEGER,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id::UUID as settlement_id,
        s.payer_id::UUID,
        payer.username::TEXT as payer_username,
        s.receiver_id::UUID,
        receiver.username::TEXT as receiver_username,
        s.amount::INTEGER,
        s.status::TEXT
    FROM public.settlements s
    LEFT JOIN public.users payer ON s.payer_id = payer.id
    LEFT JOIN public.users receiver ON s.receiver_id = receiver.id
    WHERE s.bet_id = p_bet_id
    ORDER BY s.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
