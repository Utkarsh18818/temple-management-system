import type { components } from "@/types/api";
import { apiRequest } from "@/lib/api/client";

export type PublicTemple =
  components["schemas"]["TempleResponse"];

export type PublicSeva =
  components["schemas"]["SevaResponse"];

export type PublicEvent =
  components["schemas"]["EventResponse"];

export type PublicFestival =
  components["schemas"]["FestivalResponse"];

export type PublicSevaSlot =
  components["schemas"]["SevaSlotResponse"];

export type PublicBooking = {
  id: string;
  booking_number: string;
  temple_id: string;
  devotee_id: string;
  seva_id: string;
  slot_id: string | null;
  booking_date: string;
  quantity: number;
  amount: number;
  status: string;
  payment_status: string;
  special_request: string | null;
};

export type PublicBookingListResponse = {
  items: PublicBooking[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type GetPublicTemplesParams = {
  search?: string;
  city?: string;
  state?: string;
  limit?: number;
  offset?: number;
};

export type GetPublicSevasParams = {
  templeId: string;
  search?: string;
  sevaType?: string;
  limit?: number;
  offset?: number;
};

export type GetPublicEventsParams = {
  templeId: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

export type GetPublicFestivalsParams = {
  templeId: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

export type GetPublicSlotsParams = {
  sevaId: string;
  slotDate?: string;
  limit?: number;
  offset?: number;
};

export type GetPublicBookingsParams = {
  page?: number;
  limit?: number;
};

function buildQuery(
  params: Record<
    string,
    string | number | boolean | undefined
  >,
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        searchParams.set(
          key,
          String(value),
        );
      }
    },
  );

  const query = searchParams.toString();

  return query
    ? `?${query}`
    : "";
}


// ---------------------------------------------------------
// Temples
// ---------------------------------------------------------

export async function getPublicTemples(
  params: GetPublicTemplesParams = {},
): Promise<PublicTemple[]> {
  return apiRequest<PublicTemple[]>(
    `/api/v1/public/temples${buildQuery({
      search: params.search,
      city: params.city,
      state: params.state,
      limit: params.limit,
      offset: params.offset,
    })}`,
    {
      method: "GET",
    },
  );
}

export async function getPublicTemple(
  templeId: string,
): Promise<PublicTemple> {
  return apiRequest<PublicTemple>(
    `/api/v1/public/temples/${templeId}`,
    {
      method: "GET",
    },
  );
}


// ---------------------------------------------------------
// Sevas
// ---------------------------------------------------------

export async function getPublicSevas(
  params: GetPublicSevasParams,
): Promise<PublicSeva[]> {
  return apiRequest<PublicSeva[]>(
    `/api/v1/public/temples/${params.templeId}/sevas${buildQuery({
      search: params.search,
      seva_type: params.sevaType,
      limit: params.limit,
      offset: params.offset,
    })}`,
    {
      method: "GET",
    },
  );
}

export async function getPublicSeva(
  sevaId: string,
): Promise<PublicSeva> {
  return apiRequest<PublicSeva>(
    `/api/v1/public/sevas/${sevaId}`,
    {
      method: "GET",
    },
  );
}


// ---------------------------------------------------------
// Events
// ---------------------------------------------------------

export async function getPublicEvents(
  params: GetPublicEventsParams,
): Promise<PublicEvent[]> {
  return apiRequest<PublicEvent[]>(
    `/api/v1/public/temples/${params.templeId}/events${buildQuery({
      start_date: params.startDate,
      end_date: params.endDate,
      limit: params.limit,
      offset: params.offset,
    })}`,
    {
      method: "GET",
    },
  );
}


// ---------------------------------------------------------
// Festivals
// ---------------------------------------------------------

export async function getPublicFestivals(
  params: GetPublicFestivalsParams,
): Promise<PublicFestival[]> {
  return apiRequest<PublicFestival[]>(
    `/api/v1/public/temples/${params.templeId}/festivals${buildQuery({
      start_date: params.startDate,
      end_date: params.endDate,
      limit: params.limit,
      offset: params.offset,
    })}`,
    {
      method: "GET",
    },
  );
}


// ---------------------------------------------------------
// Seva Slots
// ---------------------------------------------------------

export async function getPublicSevaSlots(
  params: GetPublicSlotsParams,
): Promise<PublicSevaSlot[]> {
  return apiRequest<PublicSevaSlot[]>(
    `/api/v1/public/sevas/${params.sevaId}/slots${buildQuery({
      slot_date: params.slotDate,
      limit: params.limit,
      offset: params.offset,
    })}`,
    {
      method: "GET",
    },
  );
}


// ---------------------------------------------------------
// Public Bookings
// ---------------------------------------------------------

export async function getPublicBookings(
  params: GetPublicBookingsParams = {},
): Promise<PublicBookingListResponse> {
  return apiRequest<PublicBookingListResponse>(
    `/api/v1/public/bookings${buildQuery({
      page: params.page,
      limit: params.limit,
    })}`,
    {
      method: "GET",
    },
  );
}

export async function getPublicBooking(
  bookingId: string,
): Promise<PublicBooking> {
  return apiRequest<PublicBooking>(
    `/api/v1/public/bookings/${bookingId}`,
    {
      method: "GET",
    },
  );
}