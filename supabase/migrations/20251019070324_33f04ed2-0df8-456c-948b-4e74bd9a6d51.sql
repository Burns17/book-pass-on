-- Create a secure function to transfer book ownership
CREATE OR REPLACE FUNCTION public.transfer_book_ownership(
  _request_id uuid,
  _textbook_id uuid,
  _new_owner_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_owner_id uuid;
  _request_borrower_id uuid;
  _request_status text;
BEGIN
  -- Get request details
  SELECT borrower_id, status, textbook_id
  INTO _request_borrower_id, _request_status, _textbook_id
  FROM requests
  WHERE id = _request_id;
  
  -- Verify the request exists and is approved
  IF _request_status IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  
  IF _request_status != 'approved' THEN
    RAISE EXCEPTION 'Request must be approved before transfer';
  END IF;
  
  -- Verify the caller is the borrower
  IF auth.uid() != _request_borrower_id THEN
    RAISE EXCEPTION 'Only the borrower can confirm pickup';
  END IF;
  
  -- Get current owner
  SELECT owner_id INTO _current_owner_id
  FROM textbooks
  WHERE id = _textbook_id;
  
  -- Transfer ownership
  UPDATE textbooks
  SET owner_id = _new_owner_id,
      status = 'available'
  WHERE id = _textbook_id;
  
  -- Mark request as completed
  UPDATE requests
  SET status = 'completed'
  WHERE id = _request_id;
END;
$$;