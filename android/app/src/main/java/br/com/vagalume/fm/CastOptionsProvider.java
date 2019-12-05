package br.com.vagalume.fm;


import android.content.Context;

import com.google.android.gms.cast.framework.CastOptions;
import com.google.android.gms.cast.framework.OptionsProvider;
import com.google.android.gms.cast.framework.SessionProvider;

import java.util.List;

/**
 * Created by rmagalhaes on 11/05/17.
 */

public class CastOptionsProvider implements OptionsProvider {
    public static final String CAST_APP_ID = "956FF161";

    @Override
    public CastOptions getCastOptions(Context context) {

        return new CastOptions.Builder()
                .setReceiverApplicationId(CAST_APP_ID)
                .build();

    }

    @Override
    public List<SessionProvider> getAdditionalSessionProviders(Context context) {
        return null;
    }
}