# -*- coding: utf-8 -*-

from django.conf.urls import url
from . import views
from django.views.generic import TemplateView

from . import views

app_name = 'monitor'
urlpatterns = [
    
    url(r'^$', TemplateView.as_view(template_name='monitor/mapmonitor.html'),name='monitor_home'),

    

    # 数据监控 --地图监控
    url(r'^mapmonitor/?$',views.MapMonitorView.as_view(),name='mapmonitor'),
    url(r'^mapmonitor2/?$',views.MapMonitorView2.as_view(),name='mapmonitor2'),
    
    url(r'^mapstation/?$',views.MapStationView.as_view(),name='mapstation'),
    
    url(r'^realtimedata/?$',views.RealTimeDataView.as_view(),name='realtimedata'),
        
]